# Event Bus

> Parte do skill `eng-frontend-microfrontend`. Leia este arquivo quando a tarefa envolver comunicação entre remotes por eventos.

## Event Bus

Remote e shell se comunicam via evento — nunca via import direto.

```typescript
// packages/mfe-contracts/src/event-bus.ts

type EventHandler<T> = (payload: T) => void

class MFEEventBus {
  private listeners = new Map<string, Set<EventHandler<unknown>>>()

  emit<T>(event: string, payload: T): void {
    this.listeners.get(event)?.forEach((handler) => handler(payload as unknown))
  }

  on<T>(event: string, handler: EventHandler<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(handler as EventHandler<unknown>)

    // retorna função de cleanup
    return () => this.listeners.get(event)?.delete(handler as EventHandler<unknown>)
  }
}

// Singleton global — compartilhado via shell context
export const eventBus = new MFEEventBus()
```

```typescript
// Uso em um remote
import { useShellContext } from '@{org}/mfe-contracts'

function CheckoutButton({ orderId }: { orderId: string }) {
  const { eventBus } = useShellContext()

  return (
    <button onClick={() => eventBus.emit('checkout:initiated', { orderId })}>
      Finalizar compra
    </button>
  )
}

// Uso no shell — escutar eventos de remotes
useEffect(() => {
  const unsubscribe = eventBus.on('checkout:initiated', ({ orderId }) => {
    navigate(`/checkout/${orderId}`)
  })
  return unsubscribe
}, [])
```

---
