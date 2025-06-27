import React from 'react';
import { Mail, Github, Instagram, MessageCircle, AtSign, ExternalLink } from 'lucide-react';

function ContactPage() {
  const contactMethods = [
    {
      icon: Mail,
      label: 'Email',
      value: 'forrest.tindall@gmail.com',
      href: 'mailto:forrest.tindall@gmail.com',
      description: 'Best for project inquiries and bug reports'
    },
    {
      icon: Github,
      label: 'GitHub',
      value: 'forresttindall',
      href: 'https://github.com/forresttindall',
      description: 'View my projects and contribute'
    },
    {
      icon: Instagram,
      label: 'Instagram',
      value: '@forrest.tindall',
      href: 'https://instagram.com/forrest.tindall',
      description: 'Follow my journey'
    },
    {
      icon: MessageCircle,
      label: 'Threads',
      value: '@forrest.tindall',
      href: 'https://www.threads.net/@forrest.tindall',
      description: 'Connect on Threads'
    },
    {
      icon: AtSign,
      label: 'Bluesky',
      value: '@forresttindall.dev',
      href: 'https://bsky.app/profile/forresttindall.dev',
      description: 'Join the conversation'
    }
  ];

  return (
    <div className="page-content">
      <div className="contact-header">
        <h2 className="contact-title">Get in Touch</h2>
        <p className="contact-subtitle">
          Have questions, suggestions, or found a bug? I'd love to hear from you.
        </p>
      </div>
      
      <div className="contact-grid">
        {contactMethods.map((method, index) => {
          const IconComponent = method.icon;
          return (
            <a
              key={index}
              href={method.href}
              target={method.href.startsWith('mailto:') ? '_self' : '_blank'}
              rel={method.href.startsWith('mailto:') ? '' : 'noopener noreferrer'}
              className="contact-card"
            >
              <div className="contact-card-icon">
                <IconComponent size={20} />
              </div>
              <div className="contact-card-content">
                <div className="contact-card-header">
                  <span className="contact-card-label">{method.label}</span>
                  <ExternalLink size={14} className="contact-card-external" />
                </div>
                <span className="contact-card-value">{method.value}</span>
                <span className="contact-card-description">{method.description}</span>
              </div>
            </a>
          );
        })}
      </div>

      <div className="contact-footer">
        <div className="contact-note">
          <Mail size={16} />
          <span>
            For WiGLE-specific questions, please contact{' '}
            <a href="mailto:WiGLE-admin@wigle.net" target="_blank" rel="noopener noreferrer">
              WiGLE Admin
            </a>
          </span>
        </div>
      </div>
    </div>
  );
}

export default ContactPage;