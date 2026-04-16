"use client";

import React, { useRef, useState } from "react";
import styles from "./ResumeUpload.module.css";

interface ResumeUploadProps {
  onSkillsExtracted: (query: string) => void;
}

export default function ResumeUpload({ onSkillsExtracted }: ResumeUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      setError("Please upload a valid PDF file.");
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/analyze-resume", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to analyze resume");
      }

      const data = await res.json();
      
      // We expect an array strings like ["React", "TypeScript", "AWS"]
      if (data.skills && Array.isArray(data.skills) && data.skills.length > 0) {
        const combinedSkills = data.skills.join(" ");
        onSkillsExtracted(combinedSkills); // Pipe it straight back to the search bar query!
      } else {
        throw new Error("Could not extract technical skills from this resume.");
      }
      
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setIsAnalyzing(false);
      // Reset input so they can upload the same file again if it failed
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className={styles.uploadWrapper}>
      <input 
        type="file" 
        accept="application/pdf" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className={styles.hiddenInput} 
      />
      
      <button 
        type="button" 
        onClick={handleUploadClick} 
        disabled={isAnalyzing}
        className={`${styles.aiButton} ${isAnalyzing ? styles.analyzing : ""}`}
      >
        {isAnalyzing ? (
          <>
            <span className={styles.spinner}></span>
            Analyzing Skills with AI...
          </>
        ) : (
          "🪄 Match Jobs to My Resume (PDF)"
        )}
      </button>

      {error && <p className={styles.errorText}>{error}</p>}
    </div>
  );
}
