import { useState } from 'react';
import { Settings } from 'lucide-react';
import { useAuth } from './hooks/useAuth';
import { useMembership } from './hooks/useMembership';
import { useMyRole } from './hooks/useMyRole';
import { markLeaderNotified } from './lib/church';
import { isSuperAdmin } from './lib/superAdmin';
import Login from './components/Login';
import ProfileSetup from './components/onboarding/ProfileSetup';
import PersonalHome from './components/PersonalHome';
import Onboarding from './components/onboarding/Onboarding';
import PendingApproval from './components/onboarding/PendingApproval';
import SuperAdmin from './components/superadmin/SuperAdmin';
import App from './App';

function Loading() {
  return (
    <div className="w-full min-h-screen flex items-center justify-center">
      <p style={{ color: '#9C8286' }} className="text-sm">
        셀싹을 펼치는 중...
      </p>
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
