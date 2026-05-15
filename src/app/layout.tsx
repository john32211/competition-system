import "./globals.css";

export const metadata = {
  title: "Robotics Competition OS",
  description: "Competition management platform for robotics education teams",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
