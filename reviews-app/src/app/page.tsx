import ProjectReviews from './components/ProjectReviews';

// Add metadata to the Home component
export const metadata = {
  title: 'Solana Project Reviews',
  description: 'View projects and their reviews on the Solana blockchain',
};

export default function Home() {
  return (
    <main>
      <ProjectReviews />
    </main>
  );
}
