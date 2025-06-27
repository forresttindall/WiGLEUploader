import React from 'react';
import './AboutPage.css'
import { FileText, Zap, Lock, Target, Trophy, Shield, Heart, Star } from 'lucide-react'

function AboutPage() {
  return (
    <div className="about-page">
      {/* Hero Section */}
  

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <h2 className="section-title">Why Choose WiGLE Uploader?</h2>
           <p className="hero-subtitle">
            The fastest, most secure way to upload your wardriving data to WiGLE.
            Built with privacy in mind, storing no data locally.
          </p>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <FileText size={48} />
              </div>
              <h3>Drag & Drop</h3>
              <p>Simply drag your files into the upload zone for instant processing</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <Zap size={48} />
              </div>
              <h3>Batch Upload</h3>
              <p>Upload multiple files simultaneously to save time and effort</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <Lock size={48} />
              </div>
              <h3>Privacy First</h3>
              <p>No data storage, no tracking. Your files are processed and uploaded securely</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <Target size={48} />
              </div>
              <h3>All Formats</h3>
              <p>Support for all major wardriving file formats including CSV, KML, and more</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <Trophy size={48} />
              </div>
              <h3>Badge Generator</h3>
              <p>Create beautiful badges to showcase your WiGLE statistics</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <Shield size={48} />
              </div>
              <h3>Secure Auth</h3>
              <p>Simple and secure authentication with your WiGLE credentials</p>
            </div>
          </div>
        </div>
      </section>

      {/* Creator Section */}
      <section className="creator-section">
        <div className="container">
          <div className="creator-card">
            <h2 className="creator-title">Created by</h2>
            <div className="creator-info">
              <a href="https://forresttindall.dev/links" target="_blank" rel="noopener noreferrer" className="creator-link">
                Forrest Tindall
              </a>
              <span className="creator-of">of</span>
              <a href="https://creationbase.io" target="_blank" className="cb-link">
                <img src="./dot-triangle.png" className="cb-logo" alt="Creationbase" />
                <span className="cb-text">CreationBase</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Support Section */}
      <section className="support-section">
        <div className="container">
          <div className="support-grid">
            <div className="support-card">
              <h3>Support the Project</h3>
              <p>Help keep WiGLE Uploader free and open source</p>
              <a href="https://account.venmo.com/u/ForrestTindall" target="_blank" rel="noopener noreferrer" className="support-btn donate-btn">
                <Heart size={20} />
                Donate
              </a>
            </div>
            <div className="support-card">
              <h3>Star on GitHub</h3>
              <p>Show your support by starring the repository</p>
              <a href="https://github.com/forresttindall/WiGLEUploader" target="_blank" rel="noopener noreferrer" className="support-btn github-btn">
                <Star size={20} />
                Star Repository
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default AboutPage;