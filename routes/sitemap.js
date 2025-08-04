const express = require('express')
const router = express.Router()
const Post = require('../models/Post')
const Category = require('../models/Category')

// @route   GET /sitemap.xml
// @desc    Generate XML sitemap
// @access  Public
router.get('/sitemap.xml', async (req, res) => {
  try {
    const baseUrl =
      process.env.FRONTEND_URL || 'https://HubFusionx-nine.vercel.app'

    // Get all published posts
    const posts = await Post.find({ status: 'published' })
      .select('slug updatedAt publishedAt')
      .sort({ publishedAt: -1 })

    // Get all categories
    const categories = await Category.find().select('slug updatedAt')

    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/blog</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>`

    // Add posts to sitemap
    posts.forEach(post => {
      const lastmod = post.updatedAt || post.publishedAt
      sitemap += `
  <url>
    <loc>${baseUrl}/blog/${post.slug}</loc>
    <lastmod>${lastmod.toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`
    })

    // Add categories to sitemap
    categories.forEach(category => {
      sitemap += `
  <url>
    <loc>${baseUrl}/blog/category/${category.slug}</loc>
    <lastmod>${category.updatedAt.toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`
    })

    sitemap += `
</urlset>`

    res.set('Content-Type', 'application/xml')
    res.send(sitemap)
  } catch (err) {
    console.error('Error generating sitemap:', err)
    res.status(500).json({
      success: false,
      message: 'Error generating sitemap'
    })
  }
})

module.exports = router
