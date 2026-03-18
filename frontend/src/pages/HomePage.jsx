import React from 'react'
import Navbar from '../components/Navbar'
import Header from '../components/Header'
import FeaturesSection from '../components/Featuressection'
import HowItWorksSection from '../components/Howitworkssection'
import Client from '../components/Client'
import FAQ from '../pages/FAQ'
import Footer from '../pages/Footer'
const HomePage = () => {
  return (
    <>
    <Navbar/>
    <Header/>
    <FeaturesSection/>
    <HowItWorksSection/>
    <Client/>
    <FAQ/>
    <Footer/>
    </>
  )
}

export default HomePage