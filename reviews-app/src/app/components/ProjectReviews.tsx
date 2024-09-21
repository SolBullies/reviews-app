"use client"; // Mark this file as a client component

import { useEffect, useState } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import idl from '../../../public/project_listing_idl.json'; // Correctly import the IDL
import { sha256 } from 'js-sha256'; // Import the sha256 function
import bs58 from 'bs58'; // Import bs58 for Base58 encoding

interface Project {
  publicKey: PublicKey;
  name: string;
  category: string;
  listed_by: PublicKey;
}

interface Review {
  project_id: PublicKey;
  reviewer: PublicKey;
  rating: number;
  review_text: string;
}

export default function ClientComponent() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [reviews, setReviews] = useState<{ [projectId: string]: Review[] }>({});

  // Helper function to calculate the 8-byte discriminator
  function getDiscriminator(accountName: string): Buffer {
    const hash = sha256.digest(`account:${accountName}`); // Use "account:" prefix as per Anchor's rules
    return Buffer.from(hash.slice(0, 8)); // Take the first 8 bytes of the hash
  }

  useEffect(() => {
    async function fetchProjects() {
      const connection = new Connection('https://api.devnet.solana.com');
      const programId = new PublicKey('HahXGYW8GUUJSvnYRgj7LaHuvLcUhhz71tbRgX6aDPuE'); // Your program ID
      const coder = new anchor.BorshCoder(idl); // Initialize Anchor's Borsh Coder with IDL

      // Manually calculate the 8-byte discriminator for the "Project" and "Review" account types
      const projectDiscriminator = getDiscriminator('Project');
      const reviewDiscriminator = getDiscriminator('Review');

      try {
        // Fetch all project accounts
        const projectAccounts = await connection.getProgramAccounts(programId, {
          filters: [
            {
              memcmp: {
                offset: 0,
                bytes: bs58.encode(projectDiscriminator), // Use Base58 encoding for the discriminator
              },
            },
          ],
        });

        const decodedProjects = projectAccounts.map((accountInfo) => {
          // Decode the account data using BorshCoder
          const projectData = coder.accounts.decode('Project', accountInfo.account.data);
          return {
            publicKey: accountInfo.pubkey,
            ...projectData,
          } as Project; // Cast to Project type
        });

        setProjects(decodedProjects);

        // Fetch all review accounts
        const reviewAccounts = await connection.getProgramAccounts(programId, {
          filters: [
            {
              memcmp: {
                offset: 0,
                bytes: bs58.encode(reviewDiscriminator), // Use Base58 encoding for the discriminator
              },
            },
          ],
        });

        // Group reviews by project_id
        const reviewsByProject: { [projectId: string]: Review[] } = {};
        reviewAccounts.forEach((accountInfo) => {
          const reviewData = coder.accounts.decode('Review', accountInfo.account.data);
          const projectId = reviewData.project_id.toString();

          if (!reviewsByProject[projectId]) {
            reviewsByProject[projectId] = [];
          }

          reviewsByProject[projectId].push(reviewData as Review); // Cast to Review type
        });

        setReviews(reviewsByProject);
      } catch (error) {
        console.error('Failed to fetch projects and reviews:', error);
      }
    }

    fetchProjects();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center mb-8">Solana Projects</h1>
      <ul className="space-y-8">
        {projects.map((project, index) => (
          <li key={index} className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
            <h2 className="text-2xl font-semibold">Project {index + 1}</h2>
            <p className="text-lg mt-4">
              <span className="font-bold">Name:</span> {project.name}
            </p>
            <p className="text-lg">
              <span className="font-bold">Category:</span> {project.category}
            </p>
            <p className="text-lg mb-4">
              <span className="font-bold">Listed by:</span> {project.listed_by.toString()}
            </p>

            <h3 className="text-xl font-semibold mt-6">Reviews</h3>
            <ul className="space-y-4 mt-4">
              {reviews[project.publicKey.toString()] ? (
                reviews[project.publicKey.toString()].map((review, idx) => (
                  <li key={idx} className="border p-4 rounded-md bg-gray-50 dark:bg-gray-700">
                    <p><span className="font-bold">Rating:</span> {review.rating}/5</p>
                    <p><span className="font-bold">Review:</span> {review.review_text}</p>
                  </li>
                ))
              ) : (
                <p>No reviews yet.</p>
              )}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}
