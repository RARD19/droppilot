'use client'

import { useEffect, useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from 'recharts'
import { supabase } from '@/lib/supabase'

export default function Home() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [filter, setFilter] = useState('Todos')

  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [price, setPrice] = useState('')
  const [country, setCountry] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)

  const [session, setSession] = useState<any>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authLoading, setAuthLoading] = useState(true)

  const chartData = products.map((p) => ({
    name:
      p.name.length > 12
        ? p.name.slice(0, 12) + '...'
        : p.name,
    ventas: p.times_sold || 0
  }))

  const filteredProducts =
    filter === 'Todos'
      ? products
      : products.filter(
          (p) =>
            p.category === filter ||
            p.decision_label === filter
        )

  const totalRevenue = products.reduce(
    (acc, p) => acc + Number(p.total_revenue || 0),
    0
  )

  const totalSales = products.reduce(
    (acc, p) => acc + Number(p.times_sold || 0),
    0
  )

  const topProduct =
    products.length > 0
      ? products.reduce((max, p) =>
          (p.times_sold || 0) > (max.times_sold || 0)
            ? p
            : max
        ).name
      : 'Ninguno'

  const avgScore =
    products.length > 0
      ? (
          products.reduce(
            (acc, p) => acc + Number(p.raw_score || 0),
            0
          ) / products.length
        ).toFixed(1)
      : 0

  useEffect(() => {
    async function loadSession() {
      const { data } = await supabase.auth.getSession()

      setSession(data.session)
      setAuthLoading(false)

      if (data.session) {
        fetchRadar()
      }
    }

    loadSession()

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)

        if (session) {
          fetchRadar()
        } else {
          setProducts([])
        }
      }
    )

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  async function fetchRadar() {
    setLoading(true)

    const { data, error } = await supabase
      .from('product_radar')
      .select('*')
      .order('raw_score', { ascending: false })

    if (error) {
      console.error(error)
      alert(error.message)
    } else {
      setProducts(data || [])
    }

    setLoading(false)
  }

  async function login() {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      alert(error.message)
    }
  }

  async function logout() {
    await supabase.auth.signOut()
    setSession(null)
    setProducts([])
  }

  function clearForm() {
    setName('')
    setCategory('')
    setPrice('')
    setCountry('')
    setEditingId(null)
  }

  function editProduct(product: any) {
    setEditingId(product.id)
    setName(product.name)
    setCategory(product.category)
    setPrice(String(product.price_eur))
    setCountry(product.target_country)

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  async function addProduct() {
    if (!name || !category || !price || !country) {
      alert('Completa todos los campos')
      return
    }

    if (editingId) {
      const { data, error } = await supabase
        .from('products')
        .update({
          name,
          category,
          price_eur: Number(price),
          target_country: country,
          ai_score:
            Number(price) < 50
              ? 85
              : Number(price) < 100
              ? 65
              : 35
        })
        .eq('id', editingId)
        .select()

      if (error) {
        alert(error.message)
      } else if (!data || data.length === 0) {
        alert('No se actualizó ningún producto')
      } else {
        alert('Producto actualizado')
        clearForm()
        await fetchRadar()
      }

      return
    }

    const { error } = await supabase
      .from('products')
      .insert([
        {
          name,
          category,
          price_eur: Number(price),
          target_country: country,
          ai_score:
            Number(price) < 50
              ? 85
              : Number(price) < 100
              ? 65
              : 35,
          active: true
        }
      ])

    if (error) {
      alert(error.message)
    } else {
      alert('Producto agregado')
      clearForm()
      await fetchRadar()
    }
  }

  async function registerSale(product: any) {
    const { error } = await supabase
      .from('sales')
      .insert([
        {
          product_id: product.id,
          sale_amount_eur: product.price_eur,
          sale_amount_brl: product.price_eur * 6.2
        }
      ])

    if (error) {
      alert(error.message)
    } else {
      await fetchRadar()
    }
  }

  async function simulateSales() {
    if (products.length === 0) {
      alert('No hay productos para simular')
      return
    }

    const weightedProducts = products.flatMap((p) => {
      const score = Number(p.raw_score || p.ai_score || 1)
      const weight = Math.max(1, Math.floor(score / 10))

      return Array(weight).fill(p)
    })

    for (let i = 0; i < 20; i++) {
      const randomProduct =
        weightedProducts[
          Math.floor(Math.random() * weightedProducts.length)
        ]

      await supabase
        .from('sales')
        .insert([
          {
            product_id: randomProduct.id,
            sale_amount_eur: randomProduct.price_eur,
            sale_amount_brl: randomProduct.price_eur * 6.2
          }
        ])
    }

    await fetchRadar()
  }

  async function resetMarket() {
  const confirmed = confirm(
    '¿Reiniciar todas las ventas del mercado?'
  )

  if (!confirmed) return

  const { error } = await supabase.rpc('reset_market')

  if (error) {
    alert(error.message)
    return
  }

  await fetchRadar()
}

async function deleteProduct(id: number) {
  const confirmed = confirm(
    '¿Eliminar este producto?'
  )

  if (!confirmed) return

  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id)

  if (error) {
    alert(error.message)
  } else {
    await fetchRadar()
  }
}  

function getColor(label: string) {
    switch (label) {
      case '🔥 WINNER':
        return 'text-green-400'
      case '🟢 STRONG':
        return 'text-green-300'
      case '🟡 AVERAGE':
        return 'text-yellow-300'
      default:
        return 'text-red-400'
    }
  }

  if (authLoading) {
    return (
      <div className="p-6 bg-black min-h-screen text-white">
        Cargando...
      </div>
    )
  }

  if (!session) {
    return (
      <div className="p-6 bg-black min-h-screen text-white flex items-center justify-center">
        <div className="bg-gray-900 p-6 rounded-xl w-full max-w-sm">
          <h1 className="text-2xl font-bold mb-4">
            🔐 DropPilot Login
          </h1>

          <input
            className="w-full mb-3 p-2 bg-gray-800 rounded"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            className="w-full mb-3 p-2 bg-gray-800 rounded"
            placeholder="Contraseña"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            onClick={login}
            className="w-full bg-blue-600 p-2 rounded"
          >
            Entrar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 bg-black min-h-screen text-white">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">
          🚀 DropPilot Radar
        </h1>

        <button
          onClick={logout}
          className="bg-gray-700 px-4 py-2 rounded-lg"
        >
          Cerrar sesión
        </button>
      </div>

      <div className="flex flex-wrap gap-4 mb-6">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="p-2 bg-gray-800 rounded"
        >
          <option>Todos</option>
          <option>🔥 WINNER</option>
          <option>🟢 STRONG</option>
          <option>🟡 AVERAGE</option>
          <option>🔴 WEAK</option>
          <option>Electronics</option>
          <option>Lifestyle</option>
          <option>Home</option>
          <option>Tech</option>
          <option>Security</option>
        </select>

        <button
          onClick={simulateSales}
          className="bg-purple-600 px-4 py-2 rounded-lg"
        >
          ⚡ Simular mercado
        </button>

        <button
          onClick={resetMarket}
          className="bg-red-600 px-4 py-2 rounded-lg"
        >
          🗑 Reiniciar mercado
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-900 p-4 rounded-xl">
          <p className="text-sm text-gray-400">Revenue Total</p>
          <p className="text-xl font-bold">
            €{totalRevenue.toFixed(2)}
          </p>
        </div>

        <div className="bg-gray-900 p-4 rounded-xl">
          <p className="text-sm text-gray-400">Ventas Totales</p>
          <p className="text-xl font-bold">{totalSales}</p>
        </div>

        <div className="bg-gray-900 p-4 rounded-xl">
          <p className="text-sm text-gray-400">Producto líder</p>
          <p className="text-lg font-bold truncate">
            {topProduct}
          </p>
        </div>

        <div className="bg-gray-900 p-4 rounded-xl">
          <p className="text-sm text-gray-400">Score promedio</p>
          <p className="text-xl font-bold">{avgScore}</p>
        </div>
      </div>

      <div className="mb-8 p-4 bg-gray-900 rounded-xl">
        <h2 className="mb-4 font-bold">
          {editingId ? 'Editar producto' : 'Agregar producto'}
        </h2>

        <div className="grid gap-2">
          <input
            className="p-2 bg-gray-800 rounded"
            placeholder="Nombre"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <input
            className="p-2 bg-gray-800 rounded"
            placeholder="Categoría"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />

          <input
            className="p-2 bg-gray-800 rounded"
            placeholder="Precio"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />

          <input
            className="p-2 bg-gray-800 rounded"
            placeholder="País"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
          />

          <button
            onClick={addProduct}
            className="bg-blue-600 p-2 rounded"
          >
            {editingId ? 'Actualizar producto' : 'Generar producto'}
          </button>

          {editingId && (
            <button
              onClick={clearForm}
              className="bg-gray-700 p-2 rounded"
            >
              Cancelar edición
            </button>
          )}
        </div>
      </div>

      {loading && <p>Cargando...</p>}

      <div className="mb-8 p-4 bg-gray-900 rounded-xl">
        <h2 className="mb-4 font-bold">📊 Ventas por producto</h2>

        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <BarChart data={chartData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="ventas" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid gap-4">
        {filteredProducts.map((p) => (
          <div
            key={p.id}
            className="p-4 bg-gray-900 rounded-xl"
          >
            <div className="flex justify-between gap-4">
              <h2>{p.name}</h2>
              <span className={getColor(p.decision_label)}>
                {p.decision_label}
              </span>
            </div>

            <div className="mt-2 text-sm">
              <p>{p.category} • {p.target_country}</p>
              <p>💰 €{p.price_eur}</p>
              <p>
                📊 Score: {Number(p.raw_score || p.ai_score).toFixed(2)}
              </p>
              <p>📦 Vendidos: {p.times_sold || 0}</p>
              <p>💵 Revenue: €{p.total_revenue || 0}</p>
              <p>
                📈 Top:{' '}
                {p.percentile
                  ? (p.percentile * 100).toFixed(0)
                  : '--'}
                %
              </p>
            </div>

            <div className="flex flex-wrap gap-2 mt-4">
              <button
                onClick={() => registerSale(p)}
                className="bg-green-600 px-4 py-2 rounded-lg"
              >
                ➕ Registrar venta
              </button>

              <button
                onClick={() => deleteProduct(p.id)}
                className="bg-red-700 px-4 py-2 rounded-lg"
              >
                🗑 Eliminar
              </button>

              <button
                onClick={() => editProduct(p)}
                className="bg-yellow-600 px-4 py-2 rounded-lg"
              >
                ✏️ Editar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}