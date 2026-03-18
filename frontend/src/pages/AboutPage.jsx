import React from 'react'
import Navbar from '../components/Navbar'
import Header from '../components/Header'
import FAQ from '../pages/FAQ'
import Footer from '../pages/Footer'
import AboutData from '../components/Aboutdata'
const AboutPage = () => {
  return (
    <div>
      <Navbar/>
      <Header/>
      <AboutData/>
      <FAQ/>
      <Footer/>
    </div>
  )
}

export default AboutPage
