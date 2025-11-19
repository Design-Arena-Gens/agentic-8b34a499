export const metadata = {
  title: 'Gerador de EA MT5',
  description: 'Estrat?gias MT5 e Rob?s EA em segundos',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body style={{ margin: 0, fontFamily: 'Inter, system-ui, Arial, sans-serif', background: '#f8fafc' }}>
        {children}
      </body>
    </html>
  );
}
