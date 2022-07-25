import Head from 'next/head'
import Link from 'next/link'
import Image from 'next/image'

const Home = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <Head>
        <title>XDC Flashloans</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="flex flex-col items-center flex-1 w-full">
        <div className='flex justify-between w-5/6 mt-4'>
          
          <div className='flex'>
            <img src='/logo.png' className='w-16'/>
            <h1 className="self-center pl-4 pr-2 text-3xl font-black text-white font-Main">XFlash</h1>
          </div>

          <div className="flex items-center text-white">
            <Link href='../'>
                <a>
                    <h1 className="font-medium hover:text-[#567ca2] transition-all font-Main">Home</h1>
                </a>
            </Link>

            <Link href='../staking'>
                <a>
                    <h1 className="mx-8 font-medium hover:text-[#567ca2] transition-all font-Main">About</h1>
                </a>
            </Link>

            <Link href='../vaults'>
                <a>
                    <h1 className="font-medium hover:text-[#567ca2] transition-all font-Main">Links</h1>
                </a>
            </Link>
          </div>

          <div className='flex'>
            <Link href='../app'>
              <a>
                <button className='text-white text-lg rounded-lg w-48 h-full bg-[#6187b9] hover:bg-[#5673a2] transition-all font-Main'>Launch App</button>
              </a>
            </Link>
          </div>

        </div>
        
        <div className='flex justify-between w-5/6 mt-8'>
          <div className='flex flex-col self-center'>
            <h1 className="flex font-bold leading-normal text-white text-8xl font-Main">XFlash</h1>
            <h1 className='flex text-4xl font-medium leading-normal text-white font-Main'>A decentralized flashloan protocol on the XinFin Blockchain.</h1>
            <div className='flex mt-8'>
              <Link href='../app'>
                <a>
                  <button className='text-white text-lg rounded-lg w-48 h-16 mr-4 bg-[#496eb3] hover:bg-[#5673a2] transition-all font-Main'>Launch App</button>
                </a>
              </Link>
              <button className='text-[#1d1d1d] text-lg rounded-lg w-48 h-16 bg-[#ffffff] hover:bg-[#5673a2] hover:text-white transition-all font-Main'>Learn More</button>
            </div>
          </div>
          <img src='/landing.png' className='w-1/2 h-1/2'/>
        </div>
        
      </main>

    </div>
  )
}

export default Home
