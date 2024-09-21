import ClientComponent from './ClientComponent';

// Add metadata to the Home component
export const metadata = {
  title: 'Solana Project Reviews',
  description: 'View projects and their reviews on the Solana blockchain',
};

export default function Home() {
  return (
    <main>
      <ClientComponent />
    </main>
  );
}
