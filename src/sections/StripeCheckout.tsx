'use client'

import { useCallback } from 'react'
import {
    EmbeddedCheckout,
    EmbeddedCheckoutProvider,
} from '@stripe/react-stripe-js'
import { getStripe } from '@/lib/stripe-client'

type StripeCheckoutProps = {
    clientSecret: string
    onComplete: () => void
}

export function StripeCheckout({ clientSecret, onComplete }: StripeCheckoutProps) {
    const handleComplete = useCallback(() => {
        onComplete()
    }, [onComplete])

    return (
        <div
            id={`stripe-checkout-${clientSecret.slice(-12)}`}
            className="overflow-hidden rounded-lg border border-base-300 bg-base-100"
        >
            <EmbeddedCheckoutProvider
                stripe={getStripe()}
                options={{ clientSecret, onComplete: handleComplete }}
            >
                <EmbeddedCheckout />
            </EmbeddedCheckoutProvider>
        </div>
    )
}
