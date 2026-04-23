'use client'

import { ConnectButton } from '@rainbow-me/rainbowkit'

export default function WalletConnectButton() {
  return (
    <ConnectButton
      accountStatus={{
        smallScreen: 'avatar',
        largeScreen: 'full',
      }}
      chainStatus="icon"
      showBalance={false}
    />
  )
}
