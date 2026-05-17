export const metadata = {
  title: "HAKOOSHI | 箱押し",
  description: "3D Sokoban — 全50面",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <body style={{ margin: 0, padding: 0, overflow: "hidden", background: "#16141a" }}>
        {children}
      </body>
    </html>
  );
}
