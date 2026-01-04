import React, { useEffect, useState } from 'react'
import NavbarAdmin from './NavbarAdmin'
import EditableImage from './EditableImage'
import './AdminHomepageImages.css'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/autoplay'
import { Link } from 'react-router-dom'

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'https://taras-kart-backend.vercel.app'

function deriveSectionFromPath(path) {
  if (path.includes('main-banner2') || path.includes('mens-slide3') || path.includes('womens-slide3')) {
    return 'hero-top'
  }
  if (path.includes('/banners/banner1') || path.includes('/banners/banner2') || path.includes('/banners/banner3')) {
    return 'hero-mid-1'
  }
  if (path.includes('/banners/banner4') || path.includes('/banners/banner5') || path.includes('/banners/banner6')) {
    return 'hero-mid-2'
  }
  if (path.includes('/banners/banner7') || path.includes('/banners/banner8') || path.includes('/banners/banner9')) {
    return 'hero-mid-3'
  }
  if (path.includes('/banners/category')) {
    return 'category-row'
  }
  if (path.includes('women-category-')) {
    return 'shop-by-category'
  }
  if (path.includes('/women/women')) {
    return 'trending-women'
  }
  if (path.includes('/men/mens')) {
    return 'trending-men'
  }
  if (path.includes('/kids/')) {
    return 'trending-kids'
  }
  if (path.includes('/women/new/category-')) {
    return 'women-twinbirds-icons'
  }
  if (path.includes('/women/new/category') && !path.includes('category-')) {
    return 'women-categories-grid'
  }
  if (path.includes('zig-zag')) {
    return 'women-indian-flower'
  }
  if (path.includes('/women/new/roll') || path.includes('main-card') || path.includes('pin1')) {
    return 'women-innerwear'
  }
  if (path.includes('men-ct-')) {
    return 'men-collections'
  }
  return 'other'
}

function deriveAltFromPath(path) {
  const parts = path.split('/')
  const file = parts[parts.length - 1] || ''
  const base = file.split('.')[0] || ''
  return base.replace(/[-_]+/g, ' ').trim() || 'Image'
}

export default function AdminHomepageImages() {
  const [remoteMap, setRemoteMap] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    const run = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/homepage-images`, { cache: 'no-store' })
        if (res.status === 304) {
          if (isMounted) setLoading(false)
          return
        }
        if (!res.ok) {
          if (isMounted) setLoading(false)
          return
        }
        const data = await res.json()
        const map = {}
        data.forEach(item => {
          map[item.id] = item
        })
        if (isMounted) {
          setRemoteMap(map)
          setLoading(false)
        }
      } catch (e) {
        if (isMounted) setLoading(false)
      }
    }
    run()
    return () => {
      isMounted = false
    }
  }, [])

  const getSlot = (path, altOverride) => {
    const rec = remoteMap[path]
    const altText = rec && rec.altText ? rec.altText : (altOverride || deriveAltFromPath(path))
    const section = rec && rec.section ? rec.section : deriveSectionFromPath(path)
    return {
      id: path,
      section,
      defaultUrl: path,
      imageUrl: rec && rec.imageUrl ? rec.imageUrl : path,
      altText
    }
  }

  const handleUpdated = updated => {
    setRemoteMap(prev => ({
      ...prev,
      [updated.id]: updated
    }))
  }

  if (loading) {
    return (
      <>
        <NavbarAdmin />
        <div className="admin-homepage-wrapper">
          <div className="admin-homepage-header">
            <h1 className="admin-homepage-title">Homepage Images</h1>
            <p className="admin-homepage-subtitle">Loading preview...</p>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <NavbarAdmin />
      <div className="home1-page-new-home">
        <div className="admin-homepage-header admin-homepage-header-bar">
          <h1 className="admin-homepage-title">Homepage Images Preview</h1>
          <p className="admin-homepage-subtitle">
            This matches the live homepage. Click any image to replace it. Text and prices are fixed.
          </p>
        </div>

        <div className="spacer-new-home">
          <section className="home1-hero-new-home">
            <div className="home1-hero-frame-new-home">
              <Swiper
                className="home1-hero-swiper-new-home"
                modules={[Autoplay]}
                loop
                slidesPerView={1}
                autoplay={{ delay: 3500, disableOnInteraction: false }}
                speed={900}
              >
                <SwiperSlide>
                  <div className="home1-hero-slide-new-home">
                    {(() => {
                      const slot = getSlot('/images/banners/main-banner2.jpg', 'Main Banner')
                      return (
                        <EditableImage
                          slotId={slot.id}
                          section={slot.section}
                          imageUrl={slot.imageUrl}
                          defaultUrl={slot.defaultUrl}
                          altText={slot.altText}
                          onUpdated={handleUpdated}
                        />
                      )
                    })()}
                  </div>
                </SwiperSlide>
                <SwiperSlide>
                  <div className="home1-hero-slide-new-home">
                    {(() => {
                      const slot = getSlot('/images/banners/mens-slide3.jpg', 'Men Banner')
                      return (
                        <EditableImage
                          slotId={slot.id}
                          section={slot.section}
                          imageUrl={slot.imageUrl}
                          defaultUrl={slot.defaultUrl}
                          altText={slot.altText}
                          onUpdated={handleUpdated}
                        />
                      )
                    })()}
                  </div>
                </SwiperSlide>
                <SwiperSlide>
                  <div className="home1-hero-slide-new-home">
                    {(() => {
                      const slot = getSlot('/images/banners/womens-slide3.jpg', 'Women Banner')
                      return (
                        <EditableImage
                          slotId={slot.id}
                          section={slot.section}
                          imageUrl={slot.imageUrl}
                          defaultUrl={slot.defaultUrl}
                          altText={slot.altText}
                          onUpdated={handleUpdated}
                        />
                      )
                    })()}
                  </div>
                </SwiperSlide>
              </Swiper>
            </div>
          </section>

          <section className="cat-section-new-home">
            <div className="cat-inner-new-home">
              <div className="cat-head-new-home">
                <h2 className="cat-title-new-home">Category</h2>
              </div>
              <div className="cat-row-new-home">
                {[
                  { path: '/images/banners/category1.avif', to: '/women', alt: 'Category 1' },
                  { path: '/images/banners/category2.avif', to: '/men', alt: 'Category 2' },
                  { path: '/images/banners/category3.avif', to: '/women', alt: 'Category 3' },
                  { path: '/images/banners/category4.avif', to: '/women', alt: 'Category 4' },
                  { path: '/images/banners/category5.avif', to: '/kids', alt: 'Category 5' }
                ].map(item => {
                  const slot = getSlot(item.path, item.alt)
                  return (
                    <div className="cat-card-new-home" key={item.path}>
                      <div className="cat-media-new-home">
                        <EditableImage
                          slotId={slot.id}
                          section={slot.section}
                          imageUrl={slot.imageUrl}
                          defaultUrl={slot.defaultUrl}
                          altText={slot.altText}
                          onUpdated={handleUpdated}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </section>

          <section className="wcat-home1">
            <div className="wcat-head-home1">
              <h2 className="wcat-title-home1">Shop by Category</h2>
              <div className="wcat-underline-home1">
                <span className="wl-home1 w1-home1"></span>
                <span className="wl-home1 w2-home1"></span>
                <span className="wl-home1 w3-home1"></span>
              </div>
            </div>

            <div className="wcat-grid-home1">
              {[
                { path: '/images/banners/women-category-anarkali.png', brand: 'Tara Anarkali', mrp: '₹3,499', off: '₹4,499' },
                { path: '/images/banners/women-category-halfsaree.png', brand: 'Tara Half Saree', mrp: '₹5,299', off: '₹6,499' },
                { path: '/images/banners/women-category-punjabi.png', brand: 'Tara Punjabi', mrp: '₹2,799', off: '₹3,499' },
                { path: '/images/banners/women-category-saree.png', brand: 'Tara Saree', mrp: '₹4,199', off: '₹5,299' }
              ].map(card => {
                const slot = getSlot(card.path, card.brand)
                return (
                  <div className="wcat-card-home1" key={card.path}>
                    <div className="wcat-media-home1">
                      <EditableImage
                        slotId={slot.id}
                        section={slot.section}
                        imageUrl={slot.imageUrl}
                        defaultUrl={slot.defaultUrl}
                        altText={slot.altText}
                        onUpdated={handleUpdated}
                      />
                    </div>
                    <div className="wcat-info-home1">
                      <h3 className="wcat-brand-home1">{card.brand}</h3>
                      <div className="wcat-price-home1">
                        <span className="wcat-mrp-home1">{card.mrp}</span>
                        <span className="wcat-off-home1">{card.off}</span>
                      </div>
                      <Link to="/women" className="wcat-buy-home1">
                        Buy Now
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="wcat-more-home1">
              <Link to="/women" className="wcat-view-home1">
                View More
              </Link>
            </div>
          </section>

          <section className="mosaic4-new-home">
            <div className="mosaic4-shell-new-home">
              <h2 className="mosaic4-title-new-home">Trending Now</h2>

              <div className="mosaic4-row-new-home">
                <div className="mosaic4-block-new-home">
                  <div className="mosaic4-grid-new-home">
                    <div className="mosaic4-promo-new-home">
                      <div className="mosaic4-promo-inner-new-home">
                        <span className="mosaic4-head-new-home">Tailored Trousers</span>
                        <span className="mosaic4-sub-new-home">Up to 65% Off</span>
                      </div>
                    </div>
                    {['/images/women/women11.jpeg', '/images/women/women12.jpeg', '/images/women/women13.jpeg'].map(path => {
                      const slot = getSlot(path, 'Women')
                      const isCta = path === '/images/women/women13.jpeg'
                      return (
                        <div
                          className={`mosaic4-card-new-home ${isCta ? 'mosaic4-cta-wrap-new-home' : ''}`}
                          key={path}
                        >
                          <EditableImage
                            slotId={slot.id}
                            section={slot.section}
                            imageUrl={slot.imageUrl}
                            defaultUrl={slot.defaultUrl}
                            altText={slot.altText}
                            onUpdated={handleUpdated}
                          />
                          {isCta && <span className="mosaic4-cta-new-home">Shop Now</span>}
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="mosaic4-block-new-home">
                  <div className="mosaic4-grid-new-home">
                    {['/images/men/mens1.jpeg', '/images/men/mens2.jpeg'].map(path => {
                      const slot = getSlot(path, 'Men')
                      return (
                        <div className="mosaic4-card-new-home" key={path}>
                          <EditableImage
                            slotId={slot.id}
                            section={slot.section}
                            imageUrl={slot.imageUrl}
                            defaultUrl={slot.defaultUrl}
                            altText={slot.altText}
                            onUpdated={handleUpdated}
                          />
                        </div>
                      )
                    })}
                    <div className="mosaic4-promo-new-home">
                      <div className="mosaic4-promo-inner-new-home">
                        <span className="mosaic4-head-new-home">Classic Polos</span>
                        <span className="mosaic4-sub-new-home">Min 40% Off</span>
                      </div>
                    </div>
                    {(() => {
                      const slot = getSlot('/images/men/mens3.jpeg', 'Men 3')
                      return (
                        <div className="mosaic4-card-new-home mosaic4-cta-wrap-new-home">
                          <EditableImage
                            slotId={slot.id}
                            section={slot.section}
                            imageUrl={slot.imageUrl}
                            defaultUrl={slot.defaultUrl}
                            altText={slot.altText}
                            onUpdated={handleUpdated}
                          />
                          <span className="mosaic4-cta-new-home">Shop Now</span>
                        </div>
                      )
                    })()}
                  </div>
                </div>

                <div className="mosaic4-block-new-home">
                  <div className="mosaic4-grid-new-home">
                    {['/images/kids/kids-formal.jpg', '/images/kids/kids16.jpeg', '/images/kids/kids17.jpeg'].map(path => {
                      if (path === '/images/kids/kids16.jpeg') {
                        return (
                          <div className="mosaic4-promo-new-home" key={path}>
                            <div className="mosaic4-promo-inner-new-home">
                              <span className="mosaic4-head-new-home">Sneakers Edit</span>
                              <span className="mosaic4-sub-new-home">Up to 70% Off</span>
                            </div>
                          </div>
                        )
                      }
                      const slot = getSlot(path, 'Kids')
                      const isCta = path === '/images/kids/kids17.jpeg'
                      return (
                        <div
                          className={`mosaic4-card-new-home ${isCta ? 'mosaic4-cta-wrap-new-home' : ''}`}
                          key={path}
                        >
                          <EditableImage
                            slotId={slot.id}
                            section={slot.section}
                            imageUrl={slot.imageUrl}
                            defaultUrl={slot.defaultUrl}
                            altText={slot.altText}
                            onUpdated={handleUpdated}
                          />
                          {isCta && <span className="mosaic4-cta-new-home">Shop Now</span>}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="home1-hero-new-home-2">
            <div className="home1-hero-frame-new-home-2">
              <Swiper
                className="home1-hero-swiper-new-home-2"
                modules={[Autoplay]}
                loop
                slidesPerView={1}
                autoplay={{ delay: 3500, disableOnInteraction: false }}
                speed={900}
              >
                {['/images/banners/banner1.jpg', '/images/banners/banner2.jpg', '/images/banners/banner3.jpg'].map(path => {
                  const slot = getSlot(path, 'Women Banner')
                  return (
                    <SwiperSlide key={path}>
                      <div className="home1-hero-slide-new-home-2">
                        <EditableImage
                          slotId={slot.id}
                          section={slot.section}
                          imageUrl={slot.imageUrl}
                          defaultUrl={slot.defaultUrl}
                          altText={slot.altText}
                          onUpdated={handleUpdated}
                        />
                      </div>
                    </SwiperSlide>
                  )
                })}
              </Swiper>
            </div>
          </section>

          <section className="aurum-women">
            <div className="aurum-shell">
              <div className="aurum-head">
                <h2 className="aurum-title">Women’s Categories</h2>
                <Link className="aurum-viewall" to="/women">
                  View all
                </Link>
              </div>

              <div className="aurum-grid">
                {[
                  { path: '/images/women/new/category12.png', brand: 'Twin Birds', cat: 'salwar Kameez' },
                  { path: '/images/women/new/category9.png', brand: 'Indian Flower', cat: 'Punjabi Suits' },
                  { path: '/images/women/new/category10.png', brand: 'Twin Birds', cat: 'Anarkali Suits' },
                  { path: '/images/women/new/category11.png', brand: 'Intimacy', cat: 'Half Saree' },
                  { path: '/images/women/new/category13.png', brand: 'Naidu Hall', cat: 'Gowns' },
                  { path: '/images/women/new/category14.png', brand: 'Aswathi', cat: 'Sharara Suits' },
                  { path: '/images/women/new/category15.png', brand: 'Twin Birds', cat: 'Lehenga Choli' },
                  { path: '/images/women/new/category16.png', brand: 'Indian Flower', cat: 'Palazzo Suits' }
                ].map(card => {
                  const slot = getSlot(card.path, card.brand)
                  return (
                    <div className="aurum-card" key={card.path}>
                      <div className="aurum-imgwrap">
                        <EditableImage
                          slotId={slot.id}
                          section={slot.section}
                          imageUrl={slot.imageUrl}
                          defaultUrl={slot.defaultUrl}
                          altText={slot.altText}
                          onUpdated={handleUpdated}
                        />
                      </div>
                      <div className="aurum-info">
                        <div className="aurum-row">
                          <span className="aurum-brand">{card.brand}</span>
                        </div>
                        <div className="aurum-row">
                          <span className="aurum-cat">{card.cat}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </section>

          <section className="wb2-sec-home1">
            <div className="wb2-head-home1">
              <h2 className="wb2-title-home1">Women • Twin Birds</h2>
              <Link to="/women?brand=Twin%20Birds" className="wb2-view-home1">
                View All
              </Link>
            </div>

            <div className="wb2-grid-home1">
              {[
                { path: '/images/women/new/category-1.png', label: 'Kurti Pants' },
                { path: '/images/women/new/category-2.png', label: 'Leggings' },
                { path: '/images/women/new/category-3.png', label: 'Lounge Wear' },
                { path: '/images/women/new/category-4.png', label: 'Shapers' },
                { path: '/images/women/new/category-5.png', label: 'Straight Pants' },
                { path: '/images/women/new/category-6.png', label: 'T-Shirts' },
                { path: '/images/women/new/category-7.png', label: 'Tops' },
                { path: '/images/women/new/category-8.png', label: 'Kids' }
              ].map(card => {
                const slot = getSlot(card.path, card.label)
                return (
                  <div className="wb2-card-home1" key={card.path}>
                    <EditableImage
                      slotId={slot.id}
                      section={slot.section}
                      imageUrl={slot.imageUrl}
                      defaultUrl={slot.defaultUrl}
                      altText={slot.altText}
                      onUpdated={handleUpdated}
                    />
                    <span className="wb2-tag-home1">{card.label}</span>
                  </div>
                )
              })}
            </div>

            <div className="wb2-pills-home1">
              <Link to="/women" className="wb2-pill-home1">
                Cotton Kurti
              </Link>
              <Link to="/women" className="wb2-pill-home1">
                Flexi Kurti Pant
              </Link>
              <Link to="/women" className="wb2-pill-home1">
                Sleek Kurti Pant
              </Link>
              <Link to="/women" className="wb2-pill-home1">
                Viscose Kurti Pant
              </Link>
            </div>
          </section>

          <section className="wb3-sec">
            <div className="wb3-head">
              <h2>Women • Twin Birds</h2>
              <Link to="/women?brand=Twin%20Birds" className="wb3-view">
                View All
              </Link>
            </div>

            <div className="wb3-belt">
              <div className="wb3-track">
                {[
                  { path: '/images/women/new/category9.png', label: 'Kurti Pants' },
                  { path: '/images/women/new/category10.png', label: 'Leggings' },
                  { path: '/images/women/new/category11.png', label: 'Lounge Wear' },
                  { path: '/images/women/new/category12.png', label: 'Shapers' },
                  { path: '/images/women/new/category13.png', label: 'Straight Pants' },
                  { path: '/images/women/new/category14.png', label: 'T-Shirts' }
                ].map(card => {
                  const slot = getSlot(card.path, card.label)
                  return (
                    <div className="wb3-item" key={card.path}>
                      <EditableImage
                        slotId={slot.id}
                        section={slot.section}
                        imageUrl={slot.imageUrl}
                        defaultUrl={slot.defaultUrl}
                        altText={slot.altText}
                        onUpdated={handleUpdated}
                      />
                      <span className="wb3-tag">{card.label}</span>
                    </div>
                  )
                })}
              </div>

              <div className="wb3-track wb3-track-rev">
                {[
                  { path: '/images/women/new/category-1.png', label: 'Tops' },
                  { path: '/images/women/new/category-2.png', label: 'Kids' },
                  { path: '/images/women/new/category-3.png', label: 'Viscose Kurti Pant' },
                  { path: '/images/women/new/category-4.png', label: 'Viscose Leggings' },
                  { path: '/images/women/new/category-5.png', label: 'Co-Ord Sets' },
                  { path: '/images/women/new/category-6.png', label: 'Saree Shaper' }
                ].map(card => {
                  const slot = getSlot(card.path, card.label)
                  return (
                    <div className="wb3-item" key={card.path}>
                      <EditableImage
                        slotId={slot.id}
                        section={slot.section}
                        imageUrl={slot.imageUrl}
                        defaultUrl={slot.defaultUrl}
                        altText={slot.altText}
                        onUpdated={handleUpdated}
                      />
                      <span className="wb3-tag">{card.label}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="wb3-actions">
              <Link to="/women" className="wb3-pill">
                Cotton Kurti
              </Link>
              <Link to="/women" className="wb3-pill">
                Flexi Kurti Pant
              </Link>
              <Link to="/women" className="wb3-pill">
                Sleek Kurti Pant
              </Link>
              <Link to="/women" className="wb3-pill">
                Viscose Kurti Pant
              </Link>
            </div>
          </section>

          <section className="home1-hero-new-home-2">
            <div className="home1-hero-frame-new-home-2">
              <Swiper
                className="home1-hero-swiper-new-home-2"
                modules={[Autoplay]}
                loop
                slidesPerView={1}
                autoplay={{ delay: 3500, disableOnInteraction: false }}
                speed={900}
              >
                {['/images/banners/banner4.png', '/images/banners/banner5.png', '/images/banners/banner6.png'].map(path => {
                  const slot = getSlot(path, 'Women Banner')
                  return (
                    <SwiperSlide key={path}>
                      <div className="home1-hero-slide-new-home-2">
                        <EditableImage
                          slotId={slot.id}
                          section={slot.section}
                          imageUrl={slot.imageUrl}
                          defaultUrl={slot.defaultUrl}
                          altText={slot.altText}
                          onUpdated={handleUpdated}
                        />
                      </div>
                    </SwiperSlide>
                  )
                })}
              </Swiper>
            </div>
          </section>

          <section className="wb4-sec">
            <div className="wb4-head">
              <h2>Women • Indian Flower</h2>
              <Link to="/women" className="wb4-view">
                View All
              </Link>
            </div>

            <div className="wb4-mag">
              <div className="wb4-col">
                {[
                  { path: '/images/women/new/zig-zag1.png', label: 'Tops' },
                  { path: '/images/women/new/zig-zag2.png', label: 'Leggings' }
                ].map(card => {
                  const slot = getSlot(card.path, card.label)
                  return (
                    <div className="wb4-card" key={card.path}>
                      <EditableImage
                        slotId={slot.id}
                        section={slot.section}
                        imageUrl={slot.imageUrl}
                        defaultUrl={slot.defaultUrl}
                        altText={slot.altText}
                        onUpdated={handleUpdated}
                      />
                      <span className="wb4-label">{card.label}</span>
                    </div>
                  )
                })}
              </div>

              <div className="wb4-col wb4-col-center">
                {(() => {
                  const slot = getSlot('/images/women/new/zig-zag3.png', 'Kurti Pants')
                  return (
                    <div className="wb4-card wb4-card-tall">
                      <EditableImage
                        slotId={slot.id}
                        section={slot.section}
                        imageUrl={slot.imageUrl}
                        defaultUrl={slot.defaultUrl}
                        altText={slot.altText}
                        onUpdated={handleUpdated}
                      />
                      <span className="wb4-badge">Kurti Pants</span>
                    </div>
                  )
                })()}
              </div>

              <div className="wb4-col">
                {[
                  { path: '/images/women/new/zig-zag4.png', label: 'Lounge Wear' },
                  { path: '/images/women/new/zig-zag5.png', label: 'Straight Pants' }
                ].map(card => {
                  const slot = getSlot(card.path, card.label)
                  return (
                    <div className="wb4-card" key={card.path}>
                      <EditableImage
                        slotId={slot.id}
                        section={slot.section}
                        imageUrl={slot.imageUrl}
                        defaultUrl={slot.defaultUrl}
                        altText={slot.altText}
                        onUpdated={handleUpdated}
                      />
                      <span className="wb4-label">{card.label}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="wb4-chips">
              <Link to="/women" className="wb4-chip">
                T-Shirts
              </Link>
              <Link to="/women" className="wb4-chip">
                Casual Shirt
              </Link>
              <Link to="/women" className="wb4-chip">
                Viscose Leggings
              </Link>
              <Link to="/women" className="wb4-chip">
                Cotton Kurti
              </Link>
            </div>
          </section>

          <section className="wb5-sec">
            <div className="wb5-head">
              <h2 className="wb5-title">Women • Innerwear</h2>
              <Link to="/women" className="wb5-view">
                View All
              </Link>
            </div>

            <div className="wb5-legend">
              <span className="wb5-chip">Intimacy</span>
              <span className="wb5-dot"></span>
              <span className="wb5-chip">Naidu Hall</span>
              <span className="wb5-dot"></span>
              <span className="wb5-chip">Aswathi</span>
            </div>

            <div className="wb5-grid">
              {[
                { path: '/images/women/new/roll1.png', brand: 'Intimacy', offer: '20% OFF', tag: 'Intimates' },
                { path: '/images/women/new/roll2.png', brand: 'Naidu Hall', offer: '30% OFF', tag: 'Everyday Comfort' },
                { path: '/images/women/new/roll3.png', brand: 'Aswathi', offer: '18% OFF', tag: 'Soft Touch' },
                { path: '/images/women/new/roll4.png', brand: 'Intimacy', offer: '25% OFF', tag: 'Co-ord Sets' },
                { path: '/images/women/new/main-card.png', brand: 'Naidu Hall', offer: '28% OFF', tag: 'Shapers', wide: true },
                { path: '/images/women/new/roll5.png', brand: 'Aswathi', offer: '22% OFF', tag: 'Comfort' },
                { path: '/images/women/new/roll6.png', brand: 'Intimacy', offer: '15% OFF', tag: 'Basics' },
                { path: '/images/women/new/pin1.jpg', brand: 'Naidu Hall', offer: '32% OFF', tag: 'Premium' },
                { path: '/images/women/new/roll8.jpg', brand: 'Intimacy', offer: '15% OFF', tag: 'Basics' },
                { path: '/images/women/new/roll1.png', brand: 'Naidu Hall', offer: '32% OFF', tag: 'Premium' }
              ].map((card, index) => {
                const slot = getSlot(card.path, card.brand)
                const extraClasses =
                  index === 0 ? ' wb5-tall' : card.wide ? ' wb5-wide' : ''
                return (
                  <div className={`wb5-card${extraClasses}`} key={`${card.path}-${index}`}>
                    <div className="wb5-imgwrap">
                      <EditableImage
                        slotId={slot.id}
                        section={slot.section}
                        imageUrl={slot.imageUrl}
                        defaultUrl={slot.defaultUrl}
                        altText={slot.altText}
                        onUpdated={handleUpdated}
                      />
                    </div>
                    <div className="wb5-info">
                      <div className="wb5-row">
                        <span className="wb5-brand">{card.brand}</span>
                        <span className="wb5-offer">{card.offer}</span>
                      </div>
                      <div className="wb5-row">
                        <span className="wb5-tag">{card.tag}</span>
                        <span className="wb5-price">
                          <span className="wb5-strike">₹1,299</span> ₹1,039
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          <section className="mb1-sec">
            <div className="mb1-head">
              <h2>Men • Collections</h2>
              <Link to="/men" className="mb1-view">
                View All
              </Link>
            </div>

            <div className="mb1-circles">
              {[
                { path: '/images/men/men-ct-1.png', label: 'Shirts' },
                { path: '/images/men/men-ct-2.png', label: 'T-Shirts' },
                { path: '/images/men/men-ct-3.png', label: 'Trousers' },
                { path: '/images/men/men-ct-4.png', label: 'Denim' },
                { path: '/images/men/men-ct-5.png', label: 'Ethnic Wear' },
                { path: '/images/men/men-ct-6.png', label: 'Winter' },
                { path: '/images/men/men-ct-7.png', label: 'Footwear' },
                { path: '/images/men/men-ct-5.png', label: 'Accessories' }
              ].map(card => {
                const slot = getSlot(card.path, card.label)
                return (
                  <div className="mb1-item" key={card.path + card.label}>
                    <span className="mb1-ring"></span>
                    <EditableImage
                      slotId={slot.id}
                      section={slot.section}
                      imageUrl={slot.imageUrl}
                      defaultUrl={slot.defaultUrl}
                      altText={slot.altText}
                      onUpdated={handleUpdated}
                    />
                    <span className="mb1-cap">{card.label}</span>
                  </div>
                )
              })}
            </div>
          </section>

          <section className="mb3-sec">
            <div className="mb3-head">
              <h2>Men • Featured Styles</h2>
              <Link to="/men" className="mb3-view">
                View All
              </Link>
            </div>

            <div className="mb3-carousel">
              <button className="mb3-arrow left" id="mb3-left">
                ‹
              </button>

              <div className="mb3-track" id="mb3-track">
                {[
                  { path: '/images/women/new/roll1.png', label: 'Jackets', to: '/men/jackets' },
                  { path: '/images/men/mens1.jpeg', label: 'Shirts', to: '/men/shirts' },
                  { path: '/images/men/mens2.jpeg', label: 'Polos', to: '/men/polos' },
                  { path: '/images/men/mens3.jpeg', label: 'Trousers', to: '/men/trousers' },
                  { path: '/images/women/new/roll2.png', label: 'Denim', to: '/men/denim' },
                  { path: '/images/women/new/roll3.png', label: 'Ethnic', to: '/men/ethnic' },
                  { path: '/images/women/new/roll4.png', label: 'Footwear', to: '/men/footwear' }
                ].map(card => {
                  const slot = getSlot(card.path, card.label)
                  return (
                    <div className="mb3-card" key={card.path + card.label}>
                      <EditableImage
                        slotId={slot.id}
                        section={slot.section}
                        imageUrl={slot.imageUrl}
                        defaultUrl={slot.defaultUrl}
                        altText={slot.altText}
                        onUpdated={handleUpdated}
                      />
                      <span className="mb3-tag">{card.label}</span>
                    </div>
                  )
                })}
              </div>

              <button className="mb3-arrow right" id="mb3-right">
                ›
              </button>
            </div>
          </section>

          <section className="home1-hero-new-home-2">
            <div className="home1-hero-frame-new-home-2">
              <Swiper
                className="home1-hero-swiper-new-home-2"
                modules={[Autoplay]}
                loop
                slidesPerView={1}
                autoplay={{ delay: 3500, disableOnInteraction: false }}
                speed={900}
              >
                {['/images/banners/banner7.png', '/images/banners/banner8.png', '/images/banners/banner9.png'].map(path => {
                  const slot = getSlot(path, 'Women Banner')
                  return (
                    <SwiperSlide key={path}>
                      <div className="home1-hero-slide-new-home-2">
                        <EditableImage
                          slotId={slot.id}
                          section={slot.section}
                          imageUrl={slot.imageUrl}
                          defaultUrl={slot.defaultUrl}
                          altText={slot.altText}
                          onUpdated={handleUpdated}
                        />
                      </div>
                    </SwiperSlide>
                  )
                })}
              </Swiper>
            </div>
          </section>

          <section className="mb4-sec">
            <div className="mb4-head">
              <h2>Men • Essentials Grid</h2>
              <Link to="/men" className="mb4-view">
                View All
              </Link>
            </div>

            <div className="mb4-grid">
              {[
                { path: '/images/men/mens1.jpeg', label: 'Shirts', to: '/men/shirts', area: 'a' },
                { path: '/images/men/mens2.jpeg', label: 'T-Shirts', to: '/men/t-shirts', area: 'b' },
                { path: '/images/men/mens3.jpeg', label: 'Trousers', to: '/men/trousers', area: 'c' },
                { path: '/images/women/new/roll2.png', label: 'Denim', to: '/men/denim', area: 'd' },
                { path: '/images/women/new/roll1.png', label: 'Jackets', to: '/men/jackets', area: 'e' },
                { path: '/images/women/new/roll4.png', label: 'Ethnic', to: '/men/ethnic', area: 'f' },
                { path: '/images/women/new/roll5.png', label: 'Footwear', to: '/men/footwear', area: 'g' }
              ].map(card => {
                const slot = getSlot(card.path, card.label)
                return (
                  <div
                    className={`mb4-tile mb4-${card.area}`}
                    key={card.path + card.label}
                  >
                    <EditableImage
                      slotId={slot.id}
                      section={slot.section}
                      imageUrl={slot.imageUrl}
                      defaultUrl={slot.defaultUrl}
                      altText={slot.altText}
                      onUpdated={handleUpdated}
                    />
                    <span className={card.area === 'a' ? 'mb4-tag' : 'mb4-cap'}>
                      {card.label}
                    </span>
                  </div>
                )
              })}
            </div>

            <div className="mb4-pills">
              <Link to="/men/shirts/formal" className="mb4-pill">
                Formal
              </Link>
              <Link to="/men/t-shirts/slim-fit" className="mb4-pill">
                Slim Fit
              </Link>
              <Link to="/men/denim/straight" className="mb4-pill">
                Straight Denim
              </Link>
              <Link to="/men/jackets/winter" className="mb4-pill">
                Winter Layer
              </Link>
            </div>
          </section>
        </div>
      </div>
    </>
  )
}
