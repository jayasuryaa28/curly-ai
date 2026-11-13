import './globals.css';

export const metadata = {
  title: 'Curly AI — AI Creative Studio',
  description: 'Generate stunning visuals with AI — Turn your ideas into images, videos and more using 200+ models.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
