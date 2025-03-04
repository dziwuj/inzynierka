import { observer } from 'mobx-react'
import { usePwa } from '../hooks/usePWA'
import { FC, useEffect, useState } from 'react'
import styled from 'styled-components'
import { Button } from '../styles/generic.styles'

const Prompt = styled.div<{ $shouldShow: boolean }>`
  display: ${({ $shouldShow }) => ($shouldShow ? 'flex' : 'none')};
  justify-content: center;
  align-items: center;
  gap: 8px;
  border-radius: 12px;
  position: fixed;
  padding: 32px 16px;
  background-color: ${({ theme }) => theme.secondary};
  color: ${({ theme }) => theme.tertiary};
  text-align: center;
  -webkit-box-shadow: 0px 8px 24px 0px #222222;
  -moz-box-shadow: 0px 8px 24px 0px #222222;
  box-shadow: 0px 8px 24px 0px #222222;

  z-index: 5;
  width: 100%;
  height: 200px;
  max-width: 320px;
  left: calc(50%);
  top: calc(50% - 80px);
  transform: translateX(-50%);

  h1 {
    font-size: 20px;
    margin-bottom: 16px;
  }

  svg {
    width: 24px;
    height: 24px;
    position: absolute;
    top: 16px;
    right: 16px;
    cursor: pointer;
  }
`

export const PWAInstallPrompt: FC = observer(() => {
  const { isPwa } = usePwa()
  const [installPrompt, setInstallPrompt] = useState<any>(null)
  const [canInstall, setCanInstall] = useState(false)

  const alreadyAsked = localStorage.getItem('installPrompt')

  const closePrompt = () => {
    localStorage.setItem('installPrompt', 'true')
    setCanInstall(false)
  }

  // pwaInstallHandler.addListener((canInstall) => {
  //   setCanInstall(canInstall)
  // })

  // const installPWA = () => {
  //   pwaInstallHandler.install()
  // }

  useEffect(() => {
    console.log(!isPwa, !alreadyAsked, canInstall)
    window.addEventListener('beforeinstallprompt', (event) => {
      console.log('beforeinstallprompt fired')
      event.preventDefault()
      setInstallPrompt(event)
      setCanInstall(true)
    })
  }, [])

  const installPWA = async () => {
    if (!installPrompt) {
      return
    }
    const result = await installPrompt.prompt()
    console.log(`Install prompt was: ${result.outcome}`)
    setInstallPrompt(null)
    setCanInstall(false)
  }

  return (
    <Prompt $shouldShow={!isPwa && !alreadyAsked && canInstall}>
      <svg onClick={closePrompt} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
        <path
          fill="currentColor"
          d="M23 20.168l-8.185-8.187 8.185-8.174-2.832-2.807-8.182 8.179-8.176-8.179-2.81 2.81 8.186 8.196-8.186 8.184 2.81 2.81 8.203-8.192 8.18 8.192z"
        />
      </svg>
      <h1> Our app is available for installation!</h1>
      <Button onClick={installPWA} type="primary">
        Install PWA
      </Button>
    </Prompt>
  )
})
