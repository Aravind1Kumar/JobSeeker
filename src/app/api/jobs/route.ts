/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';

export interface Job {
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
}

const isIndianJob = (location: string) => {
  if (!location) return true;
  const loc = location.toLowerCase();
  if (loc.includes('us only') || loc.includes('uk only') || loc.includes('europe only') || loc.includes('americas only')) return false;
  return loc.includes('india') || loc.includes('worldwide') || loc.includes('global') || loc.includes('anywhere') || loc.includes('remote') || loc.includes('apac') || loc.includes('asia');
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '0', 10);
  
  const jobs: Job[] = [];
  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

  // 1. Fetch from LinkedIn (India specifically) - Use pagination and 1 Week time filter (f_TPR=r604800)
  try {
    const baseStart = page * 100;
    const urls = [baseStart, baseStart + 25, baseStart + 50, baseStart + 75].map(start => 
      `https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=&location=India&geoId=102713980&start=${start}&f_TPR=r604800`
    );

    const responses = await Promise.all(
      urls.map(url => fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, next: { revalidate: 3600 } }).catch(() => null))
    );

    for (const linkedinRes of responses) {
      if (linkedinRes && linkedinRes.ok) {
        const htmlText = await linkedinRes.text();
        const liChunks = htmlText.split('<li>').slice(1);
        
        for (const chunk of liChunks) {
          const titleMatch = chunk.match(/<h3 class="base-search-card__title">\s*([\s\S]*?)\s*<\/h3>/);
          const companyMatch = chunk.match(/<h4 class="base-search-card__subtitle"[^>]*>\s*(?:<a[^>]*>)?\s*([\s\S]*?)\s*(?:<\/a>)?\s*<\/h4>/);
          const locationMatch = chunk.match(/<span class="job-search-card__location">\s*([\s\S]*?)\s*<\/span>/);
          const linkMatch = chunk.match(/href="([^"]+)"/);
          const timeMatch = chunk.match(/<time class="job-search-card__listdate"[^>]*datetime="([^"]+)"/);
          
          if (titleMatch && companyMatch && linkMatch) {
            const pubDate = timeMatch ? timeMatch[1] : new Date().toISOString();
            jobs.push({
              id: `li-${Math.random().toString(36).substring(7)}`,
              title: titleMatch[1].trim(),
              companyName: companyMatch[1].trim(),
              location: locationMatch ? locationMatch[1].trim() : 'India',
              type: 'Full-time',
              url: linkMatch[1].split('?')[0],
              publishedAt: pubDate,
              source: 'LinkedIn',
              tags: ['Indian']
            });
          }
        }
      }
    }
  } catch (err) {
    console.error('Error fetching LinkedIn jobs:', err);
  }

  // Only fetch fixed-aggregation APIs on the first page
  if (page === 0) {
    // 2. Fetch from Jobicy (Great for APAC/India)
    try {
      const jobicyRes = await fetch('https://jobicy.com/api/v2/remote-jobs?geo=apac', {
        next: { revalidate: 3600 }
      });
      if (jobicyRes.ok) {
        const data = await jobicyRes.json();
        const jobicyJobs = (data.jobs || []).map((job: any) => ({
          id: `jb-${job.id}`,
          title: job.jobTitle,
          companyName: job.companyName,
          location: job.jobGeo || 'APAC',
          type: Array.isArray(job.jobType) ? job.jobType.join(', ') : (job.jobType || 'Full-time'),
          url: job.url,
          publishedAt: job.pubDate,
          source: 'Jobicy',
          tags: [job.jobIndustry],
          logo: job.companyLogo
        })).filter((job: Job) => isIndianJob(job.location) && new Date(job.publishedAt).getTime() >= oneWeekAgo);
        jobs.push(...jobicyJobs);
      }
    } catch (err) {
      console.error('Error fetching Jobicy jobs:', err);
    }

    // 3. Fetch from Remotive API
    try {
      const remotiveRes = await fetch('https://remotive.com/api/remote-jobs?limit=50', {
        next: { revalidate: 3600 }
      });
      if (remotiveRes.ok) {
        const data = await remotiveRes.json();
        const remotiveJobs = (data.jobs || []).map((job: any) => ({
          id: `rm-${job.id}`,
          title: job.title,
          companyName: job.company_name,
          location: job.candidate_required_location || 'Remote',
          type: job.job_type,
          url: job.url,
          publishedAt: job.publication_date,
          source: 'Remotive',
          tags: job.tags ? job.tags.slice(0, 3) : [],
          logo: job.company_logo
        })).filter((job: Job) => isIndianJob(job.location) && new Date(job.publishedAt).getTime() >= oneWeekAgo);
        jobs.push(...remotiveJobs);
      }
    } catch (err) {
      console.error('Error fetching Remotive jobs:', err);
    }
  }

  // Sort by newest first
  jobs.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  // Filter out any anomalous future dates or strictly older data that passed through
  const filteredJobs = jobs.filter(job => new Date(job.publishedAt).getTime() >= oneWeekAgo);

  return NextResponse.json({ jobs: filteredJobs });
}
