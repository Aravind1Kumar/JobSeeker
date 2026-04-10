"use client";

import React from 'react';
import Link from 'next/link';
import { MdWorkOutline } from 'react-icons/md';
import styles from './Navbar.module.css';

const Navbar = () => {
  return (
    <header className={styles.header}>
      <div className={`container ${styles.navContainer}`}>
        <Link href="/" className={styles.logo}>
          <div className={styles.logoIcon}>
            <MdWorkOutline size={24} />
          </div>
          <span className={styles.logoText}>Job<span className={styles.logoHighlight}>Seeker</span></span>
        </Link>
        <nav className={styles.navLinks}>
          <Link href="/" className={styles.navLink}>Find Jobs</Link>
          <a href="#" className={styles.navLink}>Companies</a>
          <button 
            className={styles.postJobBtn}
            onClick={() => {
              alert("Please mail the job details to: arvindarigela1@gmail.com");
              window.location.href = "mailto:arvindarigela1@gmail.com";
            }}
          >
            Post a Job
          </button>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
