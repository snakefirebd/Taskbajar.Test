import './globals.css';

export const metadata = {
  title: 'TaskBazar - Earn & Promote',
  description: 'Premium Micro-Task Platform',
}

export default function RootLayout({ children }) {
  return (
    <html lang="bn">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      </head>
      <body>{children}</body>
    </html>
  )
}

    
