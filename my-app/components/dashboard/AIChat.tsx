'use client'

import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Bot, User } from 'lucide-react' // Asegúrate de importar User
import { Button } from "@/components/ui/button"

export default function AIChat() {
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [messages, setMessages] = useState([
    { role: 'bot', text: '¡Hola! Soy BioBot 🌱. ¿En qué puedo ayudarte hoy?' }
  ])
  
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }
  useEffect(scrollToBottom, [messages, isOpen])

  const handleSend = async () => {
    if (!input.trim()) return

    // 1. CAPTURA SEGURA: Guardamos el texto antes de borrarlo
    const messageToSend = input; 
    
    // 2. Actualizamos la interfaz (Usuario)
    setMessages(prev => [...prev, { role: 'user', text: messageToSend }])
    setInput('') // Ahora sí podemos borrar el input tranquilos
    setIsLoading(true)

    try {
      // 3. Enviamos la variable capturada 'messageToSend', NO 'input'
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            message: messageToSend,
            // Truco: Enviamos el historial previo para que tenga memoria (contexto)
            history: messages 
        })
      })
      
      const data = await res.json()

      // 4. Agregamos respuesta del Bot
      setMessages(prev => [...prev, { role: 'bot', text: data.reply }])
    } catch (error) {
      setMessages(prev => [...prev, { role: 'bot', text: 'Tuve un error de conexión ⚠️. Intenta de nuevo.' }])
    } finally {
      setIsLoading(false)
    }
  }

  // Permitir enviar con la tecla Enter
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  }

  return (
    <div className="fixed bottom-24 right-4 z-50 flex flex-col items-end">
      
      {/* VENTANA DE CHAT */}
      {isOpen && (
        <div className="mb-4 w-80 h-96 bg-white rounded-2xl shadow-2xl border border-stone-200 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-300">
          
          {/* Cabecera */}
          <div className="bg-gradient-to-r from-teal-600 to-emerald-600 p-3 flex justify-between items-center text-white">
            <div className="flex items-center gap-2">
              <div className="bg-white/20 p-1 rounded-full">
                <Bot className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm">BioBot IA</h3>
                <p className="text-[10px] text-teal-100 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span> Online
                </p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 rounded-full p-1">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Área de Mensajes */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-stone-50">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3 rounded-2xl text-sm shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-teal-600 text-white rounded-br-none' 
                    : 'bg-white text-stone-700 border border-stone-100 rounded-bl-none'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white p-3 rounded-2xl rounded-bl-none border border-stone-100 flex gap-1">
                  <span className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce delay-100"></span>
                  <span className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce delay-200"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 bg-white border-t border-stone-100 flex gap-2">
            <input 
              className="flex-1 bg-stone-100 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="Escribe tu duda..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <Button size="icon" onClick={handleSend} disabled={isLoading} className="bg-teal-600 hover:bg-teal-700 rounded-full h-9 w-9">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* BOTÓN FLOTANTE */}
      <Button 
        onClick={() => setIsOpen(!isOpen)}
        className="h-14 w-14 rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 shadow-xl shadow-teal-900/20 transition-transform active:scale-95 flex items-center justify-center"
      >
        {isOpen ? <X className="h-7 w-7" /> : <MessageCircle className="h-7 w-7" />}
      </Button>
    </div>
  )
}