/**
 * Security Implementation Examples
 *
 * This file demonstrates how to use the security features
 * implemented in the application.
 *
 * DO NOT use this component in production - it's for reference only.
 */

import React, { useState } from 'react';
import {
  SafeHtml,
  SafeText,
  SafeLink,
  SafeImage,
  SafeUserContent,
  SafeRichText,
} from '@/components/common/SafeContent';
import { useSanitizeHtml, useSanitizeUrl } from '@/hooks/useSanitize';
import nestjsClient from '@/api/nestjsClient';

/**
 * Example 1: Display User Comments with Automatic Sanitization
 */
function CommentSection({ comments }) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">User Comments</h2>
      {comments.map((comment) => (
        <SafeUserContent
          key={comment.id}
          content={comment.text}
          author={comment.author}
          timestamp={comment.createdAt}
          avatar={comment.authorAvatar}
          className="border p-4 rounded"
        />
      ))}
    </div>
  );
}

/**
 * Example 2: Display Rich Text Content
 */
function BlogPost({ post }) {
  const safeTitle = useSanitizeHtml(post.title);

  return (
    <article className="prose max-w-none">
      <h1 dangerouslySetInnerHTML={{ __html: safeTitle }} />
      <div className="text-sm text-gray-500 mb-4">
        By {post.author} on {new Date(post.date).toLocaleDateString()}
      </div>
      <SafeRichText html={post.content} className="article-content" />
    </article>
  );
}

/**
 * Example 3: User Profile with Safe Links and Images
 */
function UserProfile({ user }) {
  const safeBio = useSanitizeHtml(user.bio);

  return (
    <div className="user-profile">
      <SafeImage
        src={user.avatar}
        alt={`${user.name}'s avatar`}
        className="w-32 h-32 rounded-full"
        fallbackSrc="/images/default-avatar.png"
      />

      <h2 className="text-2xl font-bold">{user.name}</h2>

      <div
        className="bio text-gray-700 mb-4"
        dangerouslySetInnerHTML={{ __html: safeBio }}
      />

      <div className="space-y-2">
        {user.website && (
          <SafeLink href={user.website} className="text-blue-600 hover:underline">
            Website
          </SafeLink>
        )}

        {user.twitter && (
          <SafeLink href={user.twitter} className="text-blue-600 hover:underline">
            Twitter
          </SafeLink>
        )}
      </div>
    </div>
  );
}

/**
 * Example 4: Form with CSRF Protection
 */
function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });
  const [status, setStatus] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setStatus('Sending...');

      // CSRF token is automatically included by nestjsClient
      const result = await nestjsClient.post('/api/contact', formData);

      setStatus('Message sent successfully!');
      setFormData({ name: '', email: '', message: '' });
    } catch (error) {
      setStatus('Error sending message. Please try again.');
      console.error('Contact form error:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-xl font-bold">Contact Us</h2>

      <div>
        <label htmlFor="name" className="block mb-1">Name</label>
        <input
          id="name"
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full border p-2 rounded"
          required
        />
      </div>

      <div>
        <label htmlFor="email" className="block mb-1">Email</label>
        <input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="w-full border p-2 rounded"
          required
        />
      </div>

      <div>
        <label htmlFor="message" className="block mb-1">Message</label>
        <textarea
          id="message"
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          className="w-full border p-2 rounded"
          rows={4}
          required
        />
      </div>

      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Send Message
      </button>

      {status && <p className="text-sm">{status}</p>}
    </form>
  );
}

/**
 * Example 5: Display HTML with Different Sanitization Levels
 */
function ContentDisplay({ content, level = 'default' }) {
  return (
    <div className="space-y-4">
      <h3 className="font-bold">Default Sanitization</h3>
      <SafeHtml html={content} className="border p-4" />

      <h3 className="font-bold">Strict Sanitization (Minimal Tags)</h3>
      <SafeHtml html={content} strict className="border p-4" />

      <h3 className="font-bold">Plain Text (No HTML)</h3>
      <SafeText html={content} className="border p-4" />
    </div>
  );
}

/**
 * Example 6: Link List with Validation
 */
function LinkList({ links }) {
  return (
    <ul className="space-y-2">
      {links.map((link, index) => (
        <li key={index}>
          <SafeLink
            href={link.url}
            className="text-blue-600 hover:underline"
          >
            {link.title}
          </SafeLink>
        </li>
      ))}
    </ul>
  );
}

/**
 * Example 7: Image Gallery with Safe Images
 */
function ImageGallery({ images }) {
  return (
    <div className="grid grid-cols-3 gap-4">
      {images.map((image) => (
        <SafeImage
          key={image.id}
          src={image.url}
          alt={image.alt}
          className="w-full h-48 object-cover rounded"
          fallbackSrc="/images/placeholder.png"
        />
      ))}
    </div>
  );
}

/**
 * Main Example Component - DO NOT USE IN PRODUCTION
 */
export default function SecurityExample() {
  // Example data
  const exampleComments = [
    {
      id: 1,
      text: '<p>This is a <strong>safe</strong> comment!</p>',
      author: 'John Doe',
      createdAt: new Date().toISOString(),
      authorAvatar: 'https://via.placeholder.com/150',
    },
    {
      id: 2,
      text: '<script>alert("This XSS attempt will be blocked")</script><p>Safe content</p>',
      author: 'Jane Smith',
      createdAt: new Date().toISOString(),
      authorAvatar: 'https://via.placeholder.com/150',
    },
  ];

  const examplePost = {
    title: 'My <strong>Blog Post</strong>',
    author: 'Admin',
    date: new Date().toISOString(),
    content: '<p>This is the blog post content with <em>formatting</em>.</p>',
  };

  const exampleUser = {
    name: 'Example User',
    avatar: 'https://via.placeholder.com/150',
    bio: '<p>This is my <strong>bio</strong> with safe HTML.</p>',
    website: 'https://example.com',
    twitter: 'https://twitter.com/example',
  };

  const exampleLinks = [
    { title: 'Safe Link', url: 'https://example.com' },
    { title: 'Blocked XSS', url: 'javascript:alert("xss")' },
    { title: 'Relative Link', url: '/about' },
  ];

  const exampleImages = [
    { id: 1, url: 'https://via.placeholder.com/300', alt: 'Placeholder 1' },
    { id: 2, url: 'invalid-url', alt: 'This will show fallback' },
    { id: 3, url: 'https://via.placeholder.com/300', alt: 'Placeholder 3' },
  ];

  return (
    <div className="container mx-auto p-4 space-y-8">
      <h1 className="text-3xl font-bold mb-4">Security Feature Examples</h1>
      <p className="text-red-600 font-bold mb-4">
        This page is for development reference only - do not use in production!
      </p>

      <section>
        <h2 className="text-2xl font-bold mb-4">Example 1: Comment Section</h2>
        <CommentSection comments={exampleComments} />
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">Example 2: Blog Post</h2>
        <BlogPost post={examplePost} />
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">Example 3: User Profile</h2>
        <UserProfile user={exampleUser} />
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">Example 4: Contact Form (CSRF Protected)</h2>
        <ContactForm />
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">Example 5: Sanitization Levels</h2>
        <ContentDisplay content="<h1>Title</h1><p>Paragraph with <strong>bold</strong> and <script>alert('xss')</script></p>" />
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">Example 6: Link List</h2>
        <LinkList links={exampleLinks} />
        <p className="text-sm text-gray-600 mt-2">
          Note: The XSS link will be blocked and render as plain text
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">Example 7: Image Gallery</h2>
        <ImageGallery images={exampleImages} />
        <p className="text-sm text-gray-600 mt-2">
          Note: Invalid URLs will show fallback image
        </p>
      </section>
    </div>
  );
}
