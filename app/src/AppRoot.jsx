import { useState } from 'react';
import { Settings } from 'lucide-react';
import { useAuth } from './hooks/useAuth';
import { useMembership } from './hooks/useMembership';
import { useMyRole } from './hooks/useMyRole';
import { markLeaderNotified } from './lib/church';
import { isSuperAdmin } from './lib/superAdmin';
import { getLoadingTheme } from './data/loadingThemes';
import Login from './components/Login';
import ProfileSetup from './components/onboarding/ProfileSetup';
import PersonalHome from './components/PersonalHome';
import Onboarding from './components/onboarding/Onboarding';
import PendingApproval from './components/onboarding/PendingApproval';
import SuperAdmin from './components/superadmin/SuperAdmin';
import App from './App';

// 사진 속 밝은 하늘 자리(가운데, 잎/줄기보다 살짝 아래)에 제목 그룹을 얹음 — 배경이 밝고
// 평평해서 흰 테두리 없이 진한 잉크색 글씨만으로도 잘 읽힘. 테마별로 바뀌는 값(배경/폰트/색/
// 문구/장식 아이콘)은 전부 loadingThemes.js에서 가져오고, 이 컴포넌트는 레이아웃만 담당한다.
// themeId를 지정하지 않으면 기본(실사) 테마가 쓰인다 — 추후 테마 선택 기능이 생기면
// AppRoot에서 사용자가 고른 themeId를 그대로 넘겨주기만 하면 됨.
function Loading({ themeId }) {
  const theme = getLoadingTheme(themeId);
  const Decoration = theme.decoration;

  return (
    <div style={{ background: theme.background }} className="w-full min-h-screen relative">
      <div
        style={{ position: 'absolute', left: '50%', top: '66%', transform: 'translate(-50%, -50%)' }}
        className="flex flex-col items-center"
      >
        {Decoration && (
          <Decoration size={20} strokeWidth={1.8} style={{ color: theme.decorationColor, marginBottom: '6px' }} />
        )}
        <p
          style={{
            fontFamily: theme.titleFont,
            fontWeight: theme.titleWeight,
            fontSize: '2rem',
            color: theme.titleColor,
            textShadow: '0 1px 3px rgba(255,255,255,0.45)',
          }}
        >
          셀싹
        </p>
        <p
          style={{
            fontFamily: theme.subtitleFont,
            color: theme.subtitleColor,
            fontSize: '0.85rem',
            marginTop: '4px',
          }}
        >
          기도가 열매가 되는 곳
        </p>

        <div style={{ marginTop: '30px' }} className="flex flex-col items-center gap-2">
          <div
            style={{
              width: '100%',
              maxWidth: '140px',
              height: '3px',
              borderRadius: '999px',
              background: theme.progressTrackColor,
              overflow: 'hidden',
            }}
          >
            <div
              style={{ width: '40%', height: '100%', borderRadius: '999px', background: theme.progressFillColor }}
              className="loading-bar-slide"
            />
          </div>
          <p style={{ fontFamily: theme.subtitleFont, color: theme.subtitleColor, fontSize: '0.78rem' }}>
            {theme.loadingMessage}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AppRoot() {
  const { user: authUser, loading: authLoading, signIn, signOut } = useAuth();
  const { loading: memberLoading, userDoc, error: memberError } = useMembership(authUser);
  const activeCell = userDoc?.activeCell || null;
  const role = useMyRole(activeCell?.churchId, activeCell?.cellId, authUser?.uid);
  const [view, setView] = useState('main'); // 'main' | 'superadmin'
  const [showCellFlow, setShowCellFlow] = useState(false); // false면 내 기도나무(기본 화면), true면 모임(셀) 관련 화면

  // 리더 양도를 "받은" 경우에만 안내: role이 leader인데 이 셀에 대해 아직 안내를 확인 안 한 경우.
  // 직접 셀을 만들거나 되살린 경우는 markLeaderNotified가 그 자리에서 같이 호출돼서 안 뜸.
  const notifiedFor = userDoc?.leaderNotifiedFor;
  const showLeaderNotice =
    role === 'leader' &&
    activeCell &&
    (!notifiedFor || notifiedFor.churchId !== activeCell.churchId || notifiedFor.cellId !== activeCell.cellId);

  const dismissLeaderNotice = () => {
    markLeaderNotified(authUser.uid, activeCell.churchId, activeCell.cellId);
  };

  // 구글 계정 실명/사진 대신 사용자가 직접 설정한 닉네임/프로필 사진이 있으면 그걸 사용
  const user = authUser
    ? {
        uid: authUser.uid,
        email: authUser.email,
        photoURL: userDoc?.photoURL || authUser.photoURL,
        displayName: userDoc?.nickname || authUser.displayName,
      }
    : null;

  let content;

  if (authLoading) {
    content = <Loading />;
  } else if (!authUser) {
    content = <Login onSignIn={signIn} />;
  } else if (memberError) {
    content = (
      <div className="w-full min-h-screen flex flex-col items-center justify-center gap-2 px-6 text-center">
        <p style={{ color: '#C4456B' }} className="text-sm">
          데이터를 불러오지 못했어요.
        </p>
        <p style={{ color: '#9C8286' }} className="text-xs">
          {memberError}
        </p>
      </div>
    );
  } else if (memberLoading || !userDoc) {
    content = <Loading />;
  } else if (!userDoc.nickname) {
    content = <ProfileSetup user={user} />;
  } else if (view === 'superadmin' && isSuperAdmin(authUser.uid)) {
    content = <SuperAdmin onBack={() => setView('main')} />;
  } else if (!showCellFlow) {
    content = (
      <PersonalHome
        user={user}
        activeCell={activeCell}
        pendingRequest={userDoc.pendingRequest}
        onOpenCellFlow={() => setShowCellFlow(true)}
        onSignOut={signOut}
      />
    );
  } else if (activeCell) {
    const { churchId, cellId } = activeCell;
    content = (
      <App
        user={user}
        onSignOut={signOut}
        churchId={churchId}
        cellId={cellId}
        isLeader={role === 'leader'}
        onBackHome={() => setShowCellFlow(false)}
      />
    );
  } else if (userDoc.pendingRequest) {
    content = (
      <PendingApproval user={user} pendingRequest={userDoc.pendingRequest} onBackHome={() => setShowCellFlow(false)} />
    );
  } else {
    content = <Onboarding user={user} onBackHome={() => setShowCellFlow(false)} />;
  }

  const showAdminEntry = authUser && isSuperAdmin(authUser.uid) && view !== 'superadmin';

  return (
    <>
      {content}
      {showLeaderNotice && (
        <div className="fixed inset-0 flex items-center justify-center z-30 px-6">
          <div style={{ background: '#00000040' }} className="absolute inset-0" onClick={dismissLeaderNotice} />
          <div
            style={{ background: '#FFFDF9', color: '#4A3B3F' }}
            className="relative rounded-3xl px-6 py-8 flex flex-col items-center gap-3 shadow-xl text-center max-w-xs"
          >
            <span style={{ fontSize: '2.5rem' }}>👑</span>
            <p style={{ fontFamily: "'Cafe24Dongdong', 'Gowun Dodum', sans-serif", fontSize: '1.2rem' }}>
              셀의 리더가 되었어요!
            </p>
            <button
              onClick={dismissLeaderNotice}
              style={{ background: '#6FA66B', color: '#FFF8F0' }}
              className="mt-2 px-6 py-2 rounded-full text-sm font-medium"
            >
              확인
            </button>
          </div>
        </div>
      )}
      {showAdminEntry && (
        <button
          onClick={() => setView('superadmin')}
          aria-label="관리자 화면으로 가기"
          style={{ background: '#4A3B3F', color: '#FFF8F0' }}
          className="fixed top-3 right-3 z-40 w-8 h-8 rounded-full flex items-center justify-center shadow-md opacity-70"
        >
          <Settings size={14} />
        </button>
      )}
    </>
  );
}
