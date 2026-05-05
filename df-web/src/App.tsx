import { AppProviders } from '@/app/providers/AppProviders';
import { AppRouter } from '@/app/router/AppRouter';
import { Toaster } from '@/components/feedback/Toaster';

export const App: React.FC = () => {
  return (
    <AppProviders>
      <AppRouter />
      <Toaster />
    </AppProviders>
  );
};
