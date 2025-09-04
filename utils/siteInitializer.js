const Post = require('../models/Post');
const logger = require('./logger');

// Default pages for different site types
const defaultPages = {
  blog: [
    {
      title: 'Welcome to Your Blog',
      slug: 'welcome',
      content: `<h1>Welcome to Your New Blog!</h1>
      <p>Congratulations on creating your blog! This is your first post. You can edit or delete it, then start writing your own content.</p>
      <p>Here are some ideas to get you started:</p>
      <ul>
        <li>Write an introduction about yourself</li>
        <li>Share your thoughts on topics you're passionate about</li>
        <li>Tell stories from your experiences</li>
        <li>Create tutorials or how-to guides</li>
      </ul>
      <p>Happy blogging!</p>`,
      status: 'published',
      type: 'post'
    },
    {
      title: 'About',
      slug: 'about',
      content: `<h1>About Me</h1>
      <p>Welcome to my blog! I'm excited to share my thoughts and experiences with you.</p>
      <p>This is where you can tell your story. Who are you? What do you do? What are you passionate about?</p>
      <p>Feel free to customize this page to reflect your personality and interests.</p>`,
      status: 'published',
      type: 'page'
    }
  ],
  portfolio: [
    {
      title: 'Welcome to My Portfolio',
      slug: 'welcome',
      content: `<h1>Welcome to My Portfolio</h1>
      <p>Thank you for visiting my portfolio! This space showcases my work, skills, and creative journey.</p>
      <p>Here you'll find:</p>
      <ul>
        <li>My latest projects and case studies</li>
        <li>Information about my skills and experience</li>
        <li>Ways to get in touch with me</li>
      </ul>
      <p>I'm always excited to connect with fellow creatives and potential collaborators!</p>`,
      status: 'published',
      type: 'post'
    },
    {
      title: 'About Me',
      slug: 'about',
      content: `<h1>About Me</h1>
      <p>I'm a passionate creative professional dedicated to bringing ideas to life.</p>
      <h2>My Skills</h2>
      <ul>
        <li>Creative Design</li>
        <li>Project Management</li>
        <li>Problem Solving</li>
        <li>Collaboration</li>
      </ul>
      <h2>My Approach</h2>
      <p>I believe in creating meaningful work that makes a difference. Every project is an opportunity to learn, grow, and create something amazing.</p>`,
      status: 'published',
      type: 'page'
    },
    {
      title: 'Contact',
      slug: 'contact',
      content: `<h1>Let's Work Together</h1>
      <p>I'm always interested in new opportunities and collaborations.</p>
      <h2>Get In Touch</h2>
      <p>Feel free to reach out if you'd like to discuss a project, ask questions, or just say hello!</p>
      <p>You can contact me through the form below or connect with me on social media.</p>`,
      status: 'published',
      type: 'page'
    }
  ],
  business: [
    {
      title: 'Welcome to Our Business',
      slug: 'welcome',
      content: `<h1>Welcome to Our Business</h1>
      <p>We're thrilled to have you visit our website! Our company is dedicated to providing exceptional service and value to our customers.</p>
      <h2>What We Do</h2>
      <p>We specialize in delivering high-quality solutions that meet your needs and exceed your expectations.</p>
      <h2>Why Choose Us</h2>
      <ul>
        <li>Expert team with years of experience</li>
        <li>Commitment to customer satisfaction</li>
        <li>Innovative solutions</li>
        <li>Reliable support</li>
      </ul>`,
      status: 'published',
      type: 'post'
    },
    {
      title: 'About Us',
      slug: 'about',
      content: `<h1>About Our Company</h1>
      <p>Founded with a vision to make a difference, our company has grown to become a trusted partner for businesses and individuals alike.</p>
      <h2>Our Mission</h2>
      <p>To provide exceptional service and innovative solutions that help our clients achieve their goals.</p>
      <h2>Our Values</h2>
      <ul>
        <li>Integrity in everything we do</li>
        <li>Excellence in service delivery</li>
        <li>Innovation in our approach</li>
        <li>Respect for our clients and team</li>
      </ul>`,
      status: 'published',
      type: 'page'
    },
    {
      title: 'Services',
      slug: 'services',
      content: `<h1>Our Services</h1>
      <p>We offer a comprehensive range of services designed to meet your specific needs.</p>
      <h2>Service Categories</h2>
      <div class="service-grid">
        <div class="service-item">
          <h3>Consulting</h3>
          <p>Expert advice and strategic guidance to help you make informed decisions.</p>
        </div>
        <div class="service-item">
          <h3>Implementation</h3>
          <p>Professional implementation services to bring your vision to life.</p>
        </div>
        <div class="service-item">
          <h3>Support</h3>
          <p>Ongoing support to ensure your continued success.</p>
        </div>
      </div>`,
      status: 'published',
      type: 'page'
    },
    {
      title: 'Contact Us',
      slug: 'contact',
      content: `<h1>Contact Us</h1>
      <p>We'd love to hear from you! Get in touch to learn more about how we can help.</p>
      <h2>Get In Touch</h2>
      <p>Ready to get started? Contact us today to discuss your needs and how we can help you achieve your goals.</p>
      <p>We're here to answer your questions and provide the information you need to make the best decision for your business.</p>`,
      status: 'published',
      type: 'page'
    }
  ],
  news: [
    {
      title: 'Welcome to Our News Site',
      slug: 'welcome',
      content: `<h1>Welcome to Our News Platform</h1>
      <p>Stay informed with the latest news, updates, and insights from our team of dedicated journalists and contributors.</p>
      <h2>What You'll Find Here</h2>
      <ul>
        <li>Breaking news and current events</li>
        <li>In-depth analysis and commentary</li>
        <li>Feature stories and investigations</li>
        <li>Opinion pieces and editorials</li>
      </ul>
      <p>We're committed to providing accurate, timely, and relevant news coverage.</p>`,
      status: 'published',
      type: 'post'
    },
    {
      title: 'About Our Newsroom',
      slug: 'about',
      content: `<h1>About Our Newsroom</h1>
      <p>Our newsroom is dedicated to delivering high-quality journalism that informs, educates, and engages our readers.</p>
      <h2>Our Mission</h2>
      <p>To provide accurate, unbiased, and timely news coverage that serves the public interest.</p>
      <h2>Our Team</h2>
      <p>Our experienced team of journalists, editors, and contributors work around the clock to bring you the stories that matter most.</p>`,
      status: 'published',
      type: 'page'
    }
  ],
  personal: [
    {
      title: 'Welcome to My Personal Space',
      slug: 'welcome',
      content: `<h1>Welcome to My Personal Website</h1>
      <p>Hi there! Welcome to my little corner of the internet. This is where I share my thoughts, experiences, and the things that matter to me.</p>
      <h2>What You'll Find Here</h2>
      <ul>
        <li>Personal stories and reflections</li>
        <li>Photos and memories</li>
        <li>Thoughts on life, hobbies, and interests</li>
        <li>Updates on what I'm up to</li>
      </ul>
      <p>Thanks for stopping by, and I hope you enjoy exploring!</p>`,
      status: 'published',
      type: 'post'
    },
    {
      title: 'About Me',
      slug: 'about',
      content: `<h1>About Me</h1>
      <p>Hello! I'm excited to share a bit about myself with you.</p>
      <h2>Who I Am</h2>
      <p>I'm someone who believes in the power of connection, creativity, and continuous learning. This website is my way of sharing my journey with others.</p>
      <h2>What I Love</h2>
      <p>I'm passionate about many things, and I love exploring new ideas, meeting new people, and discovering what makes life interesting and meaningful.</p>
      <h2>Let's Connect</h2>
      <p>I'd love to hear from you! Feel free to reach out and share your own stories and experiences.</p>`,
      status: 'published',
      type: 'page'
    }
  ]
};

const initializeSite = async (site, userId) => {
  try {
    logger.info(`Initializing site: ${site.name} (${site._id})`);

    // Get default pages for the site type
    const pages = defaultPages[site.type] || defaultPages.blog;

    // Create default posts/pages
    const createdPosts = [];
    for (const pageData of pages) {
      const post = await Post.create({
        ...pageData,
        author: userId,
        site: site._id,
        language: 'en',
        publishedAt: new Date()
      });
      createdPosts.push(post);
      logger.info(`Created ${pageData.type}: ${pageData.title}`);
    }

    // Update site stats
    const Site = require('../models/Site');
    await Site.findByIdAndUpdate(site._id, {
      'stats.totalPosts': createdPosts.filter(p => p.type === 'post').length,
      'stats.totalPages': createdPosts.filter(p => p.type === 'page').length,
      isInitialized: true
    });

    logger.info(`Site initialization completed for: ${site.name}`);
    return {
      success: true,
      createdPosts: createdPosts.length,
      message: 'Site initialized successfully'
    };

  } catch (error) {
    logger.error(`Site initialization failed for ${site._id}:`, error);
    throw new Error(`Failed to initialize site: ${error.message}`);
  }
};

module.exports = {
  initializeSite,
  defaultPages
};