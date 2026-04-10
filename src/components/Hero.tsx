"use client";

import React, { useState } from 'react';
import styles from './Hero.module.css';
import { MdSearch } from 'react-icons/md';

interface HeroProps {
  onSearch?: (query: string) => void;
}

const Hero: React.FC<HeroProps> = ({ onSearch }) => {
  const [query, setQuery] = useState("");

  const handleSearch = () => {
    if (onSearch) onSearch(query);
  };

  return (
    <section className={styles.hero}>
      <div className={`container ${styles.heroContainer}`}>
        <h1 className={styles.title}>
          Find Your Next <span className="gradient-text">Dream Job</span>
        </h1>
        <p className={styles.subtitle}>
          Discover thousands of remote opportunities from top companies worldwide. 
          No boundaries, just possibilities.
        </p>
        
        <div className={styles.searchBar}>
          <MdSearch className={styles.searchIcon} />
          <input 
            type="text" 
            placeholder="Search by job title, company, or keywords..." 
            className={styles.searchInput}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button className={styles.searchBtn} onClick={handleSearch}>Search Jobs</button>
        </div>
        
        <div className={styles.stats}>
          <div className={styles.statItem}>
            <span className={styles.statNumber}>10k+</span>
            <span className={styles.statLabel}>Active Jobs</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statNumber}>Remote</span>
            <span className={styles.statLabel}>& Worldwide</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statNumber}>100%</span>
            <span className={styles.statLabel}>Free to Apply</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
