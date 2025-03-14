import React from 'react';

function ContactPage() {
  return (
    <div className="page-content">
      <h2>Contact</h2>
      <p>Have questions, suggestions, or found a bug? Get in touch with me!</p>
      <div className="contact-info">
        <p><strong>Email:</strong> <a href="mailto:forrest.tindall@gmail.com">forrest.tindall@gmail.com</a></p>
        <p><strong>GitHub:</strong> <a href="https://github.com/forresttindall" target="_blank" rel="noopener noreferrer">github.com/forresttindall</a></p>
        <p><strong>Instagram:</strong> <a href="https://instagram.com/4est.io" target="_blank" rel="noopener noreferrer">@4est.io</a></p>
        <p><strong>Threads</strong> <a href="https://www.threads.net/@4est.io" target="_blank" rel="noopener noreferrer">@4est.io</a></p>
        <p><strong>Bluesky</strong> <a href="https://bsky.app/profile/4est.io" target="_blank" rel="noopener noreferrer">@4est.io</a></p>
      </div>
      <p>For WiGLE-specific questions, please email <a href="mailto:WiGLE-admin@wigle.net" target="_blank" rel="noopener noreferrer">WiGLE Admin</a>.</p>
    </div>
  );
}

export default ContactPage; 