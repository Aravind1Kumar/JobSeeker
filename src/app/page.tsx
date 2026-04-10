/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState, useMemo } from "react";
import Hero from "@/components/Hero";
import JobCard from "@/components/JobCard";
import styles from "./page.module.css";
import { Job } from "./api/jobs/route";

const itKeywords = ['software', 'engineer', 'developer', 'data', 'cloud', 'backend', 'frontend', 'react', 'node', 'tech', 'web', 'app', 'programmer', 'sysadmin', 'qa', 'tester', 'analyst', 'python', 'java', 'c++', 'full-stack', 'fullstack', 'machine learning', 'ai'];

const isITJob = (job: Job) => {
  const text = (job.title + " " + (job.tags?.join(" ") || "")).toLowerCase();
  return itKeywords.some(kw => text.includes(kw));
};

export default function Home() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("All Jobs");
  const [indiaSubFilter, setIndiaSubFilter] = useState("All");
  const [page, setPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function fetchJobs() {
      try {
        const res = await fetch(`/api/jobs?page=${page}`);
        if (!res.ok) throw new Error("Failed to fetch jobs");
        const data = await res.json();
        setJobs(prev => page === 0 ? data.jobs : [...prev, ...data.jobs]);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchJobs();
  }, [page]);

  const filteredJobs = useMemo(() => {
    let result = jobs;

    if (activeTab === "All Jobs") {
      result = jobs;
    } else if (activeTab === "India") {
      result = jobs.filter(job => job.location.toLowerCase().includes('india'));
      if (indiaSubFilter === "IT") {
        result = result.filter(isITJob);
      } else if (indiaSubFilter === "Non-IT") {
        result = result.filter(job => !isITJob(job));
      }
    } else if (activeTab === "Global") {
      result = jobs.filter(job => 
        job.location.toLowerCase().includes('remote') || 
        job.location.toLowerCase().includes('anywhere') || 
        job.location.toLowerCase().includes('worldwide') ||
        job.location.toLowerCase().includes('global') ||
        job.location.toLowerCase().includes('apac')
      );
    } else {
      result = jobs.filter(job => {
        const lowerCategory = activeTab.toLowerCase();
        const inTitle = job.title?.toLowerCase().includes(lowerCategory) || false;
        const inTags = job.tags?.some(tag => typeof tag === 'string' && tag.toLowerCase().includes(lowerCategory));
        return inTitle || inTags;
      });
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(job => 
        job.title?.toLowerCase().includes(q) || 
        job.companyName?.toLowerCase().includes(q) || 
        job.tags?.some(tag => typeof tag === 'string' && tag.toLowerCase().includes(q)) ||
        job.location?.toLowerCase().includes(q)
      );
    }

    return result;
  }, [jobs, activeTab, indiaSubFilter, searchQuery]);

  const categories = ["All Jobs", "India", "Global", "Programming", "Design", "Marketing"];

  return (
    <>
      <Hero onSearch={setSearchQuery} />
      <section className={`container ${styles.mainContent}`}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Latest Opportunities (India & Global)</h2>
          <div className={styles.filterTabs}>
            {categories.map((category) => (
              <button 
                key={category}
                onClick={() => {
                  setActiveTab(category);
                  if (category !== "India") setIndiaSubFilter("All");
                }}
                className={`${styles.tab} ${activeTab === category ? styles.activeTab : ''}`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {activeTab === "India" && (
          <div className={styles.subFilterContainer} style={{ marginBottom: '24px', display: 'flex', gap: '8px' }}>
            {["All", "IT", "Non-IT"].map(sf => (
              <button
                key={sf}
                onClick={() => setIndiaSubFilter(sf)}
                className={`${styles.tab} ${indiaSubFilter === sf ? styles.activeTab : ''}`}
                style={{ fontSize: '0.8rem', padding: '6px 12px' }}
              >
                {sf} Jobs
              </button>
            ))}
          </div>
        )}

        {loading && page === 0 ? (
          <div className="spinner"></div>
        ) : error ? (
          <div className={styles.error}>{error}</div>
        ) : filteredJobs.length === 0 ? (
          <div className={styles.noJobs}>No jobs found in this category.</div>
        ) : (
          <>
            <div className={styles.jobGrid}>
              {filteredJobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
            {filteredJobs.length > 0 && (
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '48px' }}>
                <button 
                  onClick={() => setPage(p => p + 1)}
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--surface-border)',
                    padding: '12px 32px',
                    borderRadius: 'var(--radius-xl)',
                    color: 'var(--text-primary)',
                    fontWeight: '600',
                    transition: 'var(--transition)'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
                  onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--surface-border)'}
                >
                  {loading ? 'Loading...' : 'Load More Jobs'}
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </>
  );
}
