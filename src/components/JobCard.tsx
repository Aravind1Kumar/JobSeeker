/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react';
import styles from './JobCard.module.css';
import { formatDistanceToNow } from 'date-fns';
import { MdLocationOn, MdWork, MdAccessTime } from 'react-icons/md';

interface JobCardProps {
  job: {
    id: string;
    title: string;
    companyName: string;
    location: string;
    type: string;
    url: string;
    publishedAt: string;
    source: string;
    tags?: string[];
    logo?: string;
  };
}

const JobCard: React.FC<JobCardProps> = ({ job }) => {
  let timeAgo = '';
  try {
    timeAgo = formatDistanceToNow(new Date(job.publishedAt), { addSuffix: true });
  } catch (e) {
    timeAgo = 'Recently';
  }

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.companyInfo}>
          {job.logo ? (
            <img src={job.logo} alt={job.companyName} className={styles.logo} />
          ) : (
            <div className={styles.logoPlaceholder}>
              {job.companyName.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h3 className={styles.title}>{job.title}</h3>
            <p className={styles.companyName}>{job.companyName}</p>
          </div>
        </div>
        <span className={styles.sourceTag}>{job.source}</span>
      </div>
      
      <div className={styles.details}>
        <div className={styles.detailItem}>
          <MdLocationOn className={styles.icon} />
          <span>{job.location}</span>
        </div>
        {job.type && (
          <div className={styles.detailItem}>
            <MdWork className={styles.icon} />
            <span>{job.type}</span>
          </div>
        )}
        <div className={styles.detailItem}>
          <MdAccessTime className={styles.icon} />
          <span>{timeAgo}</span>
        </div>
      </div>

      {job.tags && job.tags.length > 0 && (
        <div className={styles.tags}>
          {job.tags.map((tag, idx) => (
            <span key={idx} className={styles.tag}>{tag}</span>
          ))}
        </div>
      )}
      
      <div className={styles.footer}>
        <a 
          href={job.url} 
          target="_blank" 
          rel="noopener noreferrer" 
          className={styles.applyBtn}
        >
          Apply Now
        </a>
      </div>
    </div>
  );
};

export default JobCard;
