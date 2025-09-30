export const metadata = {
  title: "Ground Zero — Per-Domain Assessment",
  description: "Deterministic Big Five per-domain assessment"
};

import "../styles/globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}


