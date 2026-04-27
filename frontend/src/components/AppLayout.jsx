import Sidebar from './Sidebar';

export default function AppLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 overflow-auto bg-slate-50">
        {children}
      </main>
    </div>
  );
}