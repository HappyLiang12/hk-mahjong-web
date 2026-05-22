import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import AppShell from './components/layout/AppShell';
import MenuScreen from './components/screens/MenuScreen';
import LobbyScreen from './components/screens/LobbyScreen';
import GameScreen from './components/screens/GameScreen';
import EndGameScreen from './components/screens/EndGameScreen';
import ScoringScreen from './components/screens/ScoringScreen';
import SettingsScreen from './components/screens/SettingsScreen';
import OnboardingScreen from './components/screens/OnboardingScreen';
import TutorialScreen from './components/screens/TutorialScreen';
import StatsScreen from './components/screens/StatsScreen';
import AchievementsScreen from './components/screens/AchievementsScreen';
import LeaderboardScreen from './components/screens/LeaderboardScreen';
import MatchHistoryScreen from './components/screens/MatchHistoryScreen';
import HouseRulesScreen from './components/screens/HouseRulesScreen';
import PracticeScreen from './components/screens/PracticeScreen';
import ReplayScreen from './components/screens/ReplayScreen';

function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <h1 className="text-6xl font-bold text-gray-500">404</h1>
      <p className="text-gray-400">呢頁唔存在</p>
      <a href="/" className="text-green-400 hover:text-green-300 underline">
        返回主頁
      </a>
    </div>
  );
}

/** Guard: redirect to /onboarding if user hasn't completed it yet; otherwise show MenuScreen */
function HomeGuard() {
  const onboardingComplete = localStorage.getItem('onboarding-complete') === 'true';
  if (!onboardingComplete) {
    return <Navigate to="/onboarding" replace />;
  }
  return <MenuScreen />;
}

export default function App() {
  const location = useLocation();

  // Route-based body class for different backgrounds
  useEffect(() => {
    const path = location.pathname;
    document.body.className = '';

    if (path === '/' || path === '/menu') {
      document.body.classList.add('bg-gradient-menu');
    } else if (path.startsWith('/game')) {
      document.body.classList.add('bg-gradient-table');
    }
  }, [location.pathname]);

  return (
    <Routes>
      {/* Onboarding — first visit, no shell */}
      <Route path="/onboarding" element={<OnboardingScreen />} />

      {/* Game flow screens — full-screen, no header/footer */}
      <Route path="/game" element={<GameScreen />} />
      <Route path="/game/result" element={<EndGameScreen />} />
      <Route path="/game/scoring" element={<ScoringScreen />} />

      {/* AppShell layout wraps all other screens */}
      <Route element={<AppShell />}>
        {/* Home — shows MenuScreen, or redirects to onboarding on first visit */}
        <Route path="/" element={<HomeGuard />} />

        {/* Lobby */}
        <Route path="/lobby" element={<LobbyScreen />} />

        {/* Settings & rules */}
        <Route path="/settings" element={<SettingsScreen />} />
        <Route path="/rules" element={<HouseRulesScreen />} />

        {/* Learning */}
        <Route path="/tutorial" element={<TutorialScreen />} />
        <Route path="/practice" element={<PracticeScreen />} />

        {/* Stats & history */}
        <Route path="/stats" element={<StatsScreen />} />
        <Route path="/achievements" element={<AchievementsScreen />} />
        <Route path="/leaderboard" element={<LeaderboardScreen />} />
        <Route path="/history" element={<MatchHistoryScreen />} />
        <Route path="/replay" element={<ReplayScreen />} />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
