import './globals.css';
import { StoreProvider } from '@/context/store-context';

export const metadata = {
  title: 'SDS EMS — Spirit Data Solutions Employee Management System',
  description: 'Production-ready SaaS Employee Management System for Spirit Data Solutions.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans antialiased min-h-screen bg-background text-foreground">
        <StoreProvider>
          {children}
        </StoreProvider>
      </body>
    </html>
  );
}
