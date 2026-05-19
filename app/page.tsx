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
  const [dailySales, setDailySales] = useState<any[]>([])

  const [filter, setFilter] = useState('Todos')
  const [searchTerm, setSearchTerm] = useState('')

  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [price, setPrice] = useState('')
  const [cost, setCost] = useState('')
  const [country, setCountry] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const categoryOptions = [
  'Electronics',
  'Lifestyle',
  'Home',
  'Tech',
  'Security'
]

const countryOptions = [
  'Spain',
  'Germany',
  'France',
  'Italy',
  'Portugal',
  'Brazil',
  'Uruguay'
]

  const [session, setSession] = useState<any>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authLoading, setAuthLoading] = useState(true)

  const chartData = products
  .map((p) => ({
    name:
      p.name.length > 14
        ? p.name.slice(0, 14) + '...'
        : p.name,
    ventas: Number(p.times_sold || 0)
  }))
  .filter((p) => p.ventas > 0)
  .sort((a, b) => b.ventas - a.ventas)

  const profitData = products
  .map((p) => ({
    name:
      p.name.length > 14
        ? p.name.slice(0, 14) + '...'
        : p.name,
    profit: Number(p.total_profit || 0)
  }))
  .filter((p) => p.profit > 0)
  .sort((a, b) => b.profit - a.profit)

  const filteredProducts = products.filter((p) => {
  const matchesFilter =
    filter === 'Todos' ||
    p.category === filter ||
    p.decision_label === filter

  const matchesSearch =
    p.name.toLowerCase().includes(searchTerm.toLowerCase())

  return matchesFilter && matchesSearch
})

  const totalRevenue = products.reduce(
    (acc, p) => acc + Number(p.total_revenue || 0),
    0
  )

  const totalSales = products.reduce(
    (acc, p) => acc + Number(p.times_sold || 0),
    0
  )

  const totalProfit = products.reduce(
  (acc, p) => acc + Number(p.total_profit || 0),
  0
)

const realMargin =
  totalRevenue > 0
    ? ((totalProfit / totalRevenue) * 100).toFixed(1)
    : '0.0'

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

      function getActionPriority(action: string) {
  switch (action) {
    case 'Escalar':
      return 5
    case 'Seguir probando':
      return 4
    case 'Testear':
      return 3
    case 'Observar':
      return 2
    case 'Analizar':
      return 1
    case 'Pausar':
      return 0
    default:
      return 0
  }
}

const recommendedProduct =
  products
    .map((product) => {
      const recommendation = getRecommendation(product)
      const actionPriority = getActionPriority(recommendation.action)
      const margin = Number(product.margin_percent || 0)
      const totalProfit = Number(product.total_profit || 0)
      const score = Number(product.raw_score || product.ai_score || 0)
      const hasCost = Number(product.cost_eur || 0) > 0

      return {
        product,
        recommendationScore:
          actionPriority * 100000 +
          (hasCost ? 10000 : 0) +
          margin * 100 +
          totalProfit +
          score
      }
    })
    .sort((a, b) => b.recommendationScore - a.recommendationScore)[0]
    ?.product || null

      const recommendationCounts = products.reduce((acc, product) => {
  const action = getRecommendation(product).action
  acc[action] = (acc[action] || 0) + 1
  return acc
}, {} as Record<string, number>)

const actionSummary = [
  {
    label: 'Escalar',
    emoji: '🚀',
    count: recommendationCounts['Escalar'] || 0
  },
  {
    label: 'Testear',
    emoji: '🧪',
    count: recommendationCounts['Testear'] || 0
  },
  {
    label: 'Seguir probando',
    emoji: '🔁',
    count: recommendationCounts['Seguir probando'] || 0
  },
  {
    label: 'Observar',
    emoji: '👀',
    count: recommendationCounts['Observar'] || 0
  },
  {
    label: 'Pausar',
    emoji: '⏸',
    count: recommendationCounts['Pausar'] || 0
  }
]

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

  async function fetchDailySales() {
  const fromDate = new Date()
  fromDate.setDate(fromDate.getDate() - 6)
  fromDate.setHours(0, 0, 0, 0)

  const { data, error } = await supabase
    .from('sales')
    .select('created_at, sale_amount_eur')
    .gte('created_at', fromDate.toISOString())
    .order('created_at', { ascending: true })

  if (error) {
    console.error(error)
    return
  }

  const days: {
    date: string
    dia: string
    ventas: number
    revenue: number
  }[] = []

  for (let i = 6; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)

    const key = date.toISOString().slice(0, 10)

    days.push({
      date: key,
      dia: date.toLocaleDateString('es-ES', {
        weekday: 'short'
      }),
      ventas: 0,
      revenue: 0
    })
  }

  data?.forEach((sale) => {
    const key = new Date(sale.created_at).toISOString().slice(0, 10)
    const day = days.find((d) => d.date === key)

    if (day) {
      day.ventas += 1
      day.revenue += Number(sale.sale_amount_eur || 0)
    }
  })

  setDailySales(days)
}
  
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

    await fetchDailySales()
    
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
    setCost('')
    setCountry('')
    setEditingId(null)
  }

  function editProduct(product: any) {
    setEditingId(product.id)
    setName(product.name)
    setCategory(product.category)
    setPrice(String(product.price_eur))
    setCost(String(product.cost_eur || 0))
    setCountry(product.target_country)

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  async function addProduct() {
    if (!name || !category || !price || !cost || !country) {
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
          cost_eur: Number(cost),
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
          cost_eur: Number(cost),
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
    '¿Eliminar este producto y sus ventas asociadas?'
  )

  if (!confirmed) return

  const { error } = await supabase.rpc('delete_product', {
    p_product_id: id
  })

  if (error) {
    alert(error.message)
  } else {
    await fetchRadar()
  }
}  

function getRecommendation(product: any) {
  const sales = Number(product.times_sold || 0)
  const revenue = Number(product.total_revenue || 0)
  const score = Number(product.raw_score || product.ai_score || 0)
  const label = product.decision_label

  const cost = Number(product.cost_eur || 0)
  const margin = Number(product.margin_percent || 0)
  const unitProfit = Number(product.unit_profit || 0)
  const totalProfit = Number(product.total_profit || 0)
  const hasCost = cost > 0

  if (hasCost && unitProfit <= 0) {
    return {
      action: 'Pausar',
      reason: 'El producto no deja ganancia estimada por unidad.',
      nextStep: 'Revisar costo, precio de venta o proveedor antes de seguir probando.'
    }
  }

  if (hasCost && margin < 15) {
    return {
      action: 'Pausar',
      reason: 'El margen estimado es demasiado bajo para priorizar este producto.',
      nextStep: 'Buscar mejor costo o subir precio antes de invertir más.'
    }
  }

  if (
    label === '🔥 WINNER' &&
    sales >= 3 &&
    revenue > 0 &&
    (!hasCost || (margin >= 30 && totalProfit > 0))
  ) {
    return {
      action: 'Escalar',
      reason: hasCost
        ? 'Tiene ventas reales, buen revenue, margen saludable y profit positivo.'
        : 'Tiene ventas reales, buen revenue y score alto, pero aún falta cargar costo real.',
      nextStep: hasCost
        ? 'Priorizar este producto y probar más presupuesto.'
        : 'Cargar costo estimado antes de escalar con más seguridad.'
    }
  }

  if (
    (label === '🔥 WINNER' || label === '🟢 STRONG') &&
    sales === 0
  ) {
    if (hasCost && margin < 25) {
      return {
        action: 'Observar',
        reason: 'Tiene potencial, pero el margen estimado no es muy atractivo todavía.',
        nextStep: 'Comparar con proveedores o ajustar precio antes de testear.'
      }
    }

    return {
      action: 'Testear',
      reason: hasCost
        ? 'Tiene buen potencial y margen aceptable, pero todavía no tiene ventas registradas.'
        : 'Tiene buen potencial, pero todavía no tiene ventas ni costo real cargado.',
      nextStep: 'Hacer una prueba inicial antes de invertir fuerte.'
    }
  }

  if (label === '🟢 STRONG' && sales > 0) {
    if (hasCost && margin < 25) {
      return {
        action: 'Observar',
        reason: 'Tiene señales positivas, pero el margen podría ser bajo para escalar.',
        nextStep: 'Registrar más datos y revisar si el profit compensa.'
      }
    }

    return {
      action: 'Seguir probando',
      reason: hasCost
        ? 'Ya muestra señales positivas y mantiene margen razonable.'
        : 'Ya muestra señales positivas, pero falta cargar costo real.',
      nextStep: 'Registrar más ventas y observar si mantiene el rendimiento.'
    }
  }

  if (label === '🟡 AVERAGE') {
    return {
      action: 'Observar',
      reason: hasCost
        ? 'Tiene potencial medio; conviene compararlo por margen y profit frente a otros productos.'
        : 'Tiene potencial medio, pero falta cargar costo real para evaluar rentabilidad.',
      nextStep: 'Compararlo con productos similares antes de priorizarlo.'
    }
  }

  if (
  sales > 0 &&
  hasCost &&
  margin >= 30 &&
  totalProfit > 0 &&
  label === '🔴 WEAK'
) {
  return {
    action: 'Observar',
    reason: 'Aunque está por debajo de otros productos del radar, ya tiene ventas, margen saludable y profit positivo.',
    nextStep: 'No escalar todavía, pero seguir monitoreándolo antes de pausarlo.'
  }
}

if (
  sales === 0 &&
  hasCost &&
  margin >= 40 &&
  unitProfit > 0 &&
  score >= 50
) {
  return {
    action: 'Testear',
    reason: 'Tiene margen saludable y buen profit por unidad, pero todavía no tiene ventas registradas.',
    nextStep: 'Hacer una prueba inicial pequeña antes de decidir si escalar o pausar.'
  }
}
  
  if (score < 30 || label === '🔴 WEAK') {
    return {
      action: 'Pausar',
      reason: hasCost
        ? 'Está por debajo de otros productos del radar o no justifica suficiente profit.'
        : 'Está por debajo de otros productos del radar y falta información de costo.',
      nextStep: 'No priorizarlo por ahora. Revisar precio, costo, país, categoría o esperar más datos.'
    }
  }

  return {
    action: 'Analizar',
    reason: 'El producto necesita más información antes de tomar una decisión.',
    nextStep: 'Registrar más datos, cargar costo real o simular mercado.'
  }
}

function exportCSV() {
  const rows = filteredProducts.map((p) => {
    const recommendation = getRecommendation(p)

    return {
      Nombre: p.name,
      Categoria: p.category,
      Pais: p.target_country,
      PrecioEUR: p.price_eur,
      CostoEUR: p.cost_eur || 0,
      ProfitUnidadEUR: Number(p.unit_profit || 0).toFixed(2),
      MargenPercent: Number(p.margin_percent || 0).toFixed(1),
      ProfitTotalEUR: Number(p.total_profit || 0).toFixed(2),
      Vendidos: p.times_sold || 0,
      RevenueEUR: p.total_revenue || 0,
      Score: Number(p.raw_score || p.ai_score).toFixed(2),
      Label: p.decision_label,
      Recomendacion: recommendation.action,
      Motivo: recommendation.reason,
      SiguientePaso: recommendation.nextStep
    }
  })

  if (rows.length === 0) {
    alert('No hay productos para exportar')
    return
  }

  const headers = Object.keys(rows[0])

  const csv = [
    headers.join(','),
    ...rows.map((row) =>
      headers
        .map((header) => {
          const value = String(row[header as keyof typeof row] ?? '')
          return `"${value.replace(/"/g, '""')}"`
        })
        .join(',')
    )
  ].join('\n')

  const blob = new Blob([csv], {
    type: 'text/csv;charset=utf-8;'
  })

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  const safeFilter = filter
  .replace(/[^a-zA-Z0-9]/g, '')
  .trim() || 'Todos'

link.download = `droppilot-${safeFilter}.csv`
  link.click()

  URL.revokeObjectURL(url)
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
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-7xl p-6">
        <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-gray-400">
              Product intelligence dashboard
            </p>
            <h1 className="text-4xl font-bold tracking-tight">
              🚀 DropPilot Radar
            </h1>
          </div>

          <button
            onClick={logout}
            className="rounded-xl bg-gray-800 px-4 py-2 text-sm font-medium hover:bg-gray-700"
          >
            Cerrar sesión
          </button>
        </header>

        <section className="mb-8 rounded-2xl border border-gray-800 bg-gray-950 p-4">
          <div className="flex flex-wrap gap-3">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="rounded-xl border border-gray-700 bg-gray-900 px-4 py-2 text-sm"
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

            <input
  className="rounded-xl border border-gray-700 bg-gray-900 px-4 py-2 text-sm outline-none focus:border-blue-500"
  placeholder="Buscar producto..."
  value={searchTerm}
  onChange={(e) => setSearchTerm(e.target.value)}
/>

            <button
              onClick={simulateSales}
              className="rounded-xl bg-purple-600 px-4 py-2 text-sm font-medium hover:bg-purple-500"
            >
              ⚡ Simular mercado
            </button>

            <button
              onClick={resetMarket}
              className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium hover:bg-red-500"
            >
              🗑 Reiniciar mercado
            </button>

            <button
  onClick={exportCSV}
  className="rounded-xl bg-gray-700 px-4 py-2 text-sm font-medium hover:bg-gray-600"
>
  📄 Exportar CSV
</button>
          </div>
        </section>

        {recommendedProduct && (() => {
  const recommendation = getRecommendation(recommendedProduct)

  return (
    <section className="mb-8 rounded-2xl border border-blue-800 bg-blue-950/30 p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-medium text-blue-300">
            🏆 Mejor candidato actual
          </p>

          <h2 className="mt-2 text-2xl font-bold">
            {recommendedProduct.name}
          </h2>

          <p className="mt-1 text-sm text-gray-400">
            {recommendedProduct.category} • {recommendedProduct.target_country}
          </p>
        </div>

        <div className="rounded-xl bg-gray-950 p-4 text-sm md:max-w-xl">
          <p>
            <span className="text-gray-400">Acción sugerida:</span>{' '}
            <span className="font-bold text-blue-300">
              {recommendation.action}
            </span>
          </p>

          <p className="mt-2">
            <span className="text-gray-400">Motivo:</span>{' '}
            {recommendation.reason}
          </p>

          <p className="mt-2">
            <span className="text-gray-400">Siguiente paso:</span>{' '}
            {recommendation.nextStep}
          </p>
        </div>
      </div>
    </section>
  )
})()}
        
        <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
  <div className="rounded-2xl border border-gray-800 bg-gray-950 p-5">
    <p className="text-sm text-gray-400">Revenue Total</p>
    <p className="mt-2 text-2xl font-bold">
      €{totalRevenue.toFixed(2)}
    </p>
  </div>

  <div className="rounded-2xl border border-gray-800 bg-gray-950 p-5">
    <p className="text-sm text-gray-400">Profit Total</p>
    <p className="mt-2 text-2xl font-bold">
      €{totalProfit.toFixed(2)}
    </p>
  </div>

  <div className="rounded-2xl border border-gray-800 bg-gray-950 p-5">
  <p className="text-sm text-gray-400">Margen real</p>
  <p className="mt-2 text-2xl font-bold">
    {realMargin}%
  </p>
</div>

  <div className="rounded-2xl border border-gray-800 bg-gray-950 p-5">
    <p className="text-sm text-gray-400">Ventas Totales</p>
    <p className="mt-2 text-2xl font-bold">{totalSales}</p>
  </div>

  <div className="rounded-2xl border border-gray-800 bg-gray-950 p-5">
    <p className="text-sm text-gray-400">Producto líder</p>
    <p className="mt-2 truncate text-xl font-bold">
      {topProduct}
    </p>
  </div>

  <div className="rounded-2xl border border-gray-800 bg-gray-950 p-5">
    <p className="text-sm text-gray-400">Score promedio</p>
    <p className="mt-2 text-2xl font-bold">{avgScore}</p>
  </div>
</section>

<section className="mb-8 rounded-2xl border border-gray-800 bg-gray-950 p-5">
  <h2 className="mb-4 text-lg font-bold">
    🧭 Resumen de decisiones
  </h2>

  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
    {actionSummary.map((item) => (
      <div
        key={item.label}
        className="rounded-xl bg-gray-900 p-4"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{item.emoji}</span>

          <div>
            <p className="text-xl font-bold">{item.count}</p>
            <p className="text-sm text-gray-400">
              {item.label}
            </p>
          </div>
        </div>
      </div>
    ))}
  </div>
</section>

        <section className="mb-8 grid gap-6 lg:grid-cols-3">
  <div className="rounded-2xl border border-gray-800 bg-gray-950 p-5 lg:col-span-1">
    <h2 className="mb-4 text-lg font-bold">
      {editingId ? 'Editar producto' : 'Agregar producto'}
    </h2>

    <div className="grid gap-3">
      <input
        className="rounded-xl border border-gray-700 bg-gray-900 p-3 text-sm outline-none focus:border-blue-500"
        placeholder="Nombre"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <select
        className="rounded-xl border border-gray-700 bg-gray-900 p-3 text-sm outline-none focus:border-blue-500"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
      >
        <option value="">Selecciona categoría</option>

        {!categoryOptions.includes(category) && category && (
          <option value={category}>{category}</option>
        )}

        {categoryOptions.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>

      <input
        className="rounded-xl border border-gray-700 bg-gray-900 p-3 text-sm outline-none focus:border-blue-500"
        placeholder="Precio"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
      />

      <input
        className="rounded-xl border border-gray-700 bg-gray-900 p-3 text-sm outline-none focus:border-blue-500"
        placeholder="Costo estimado"
        value={cost}
        onChange={(e) => setCost(e.target.value)}
      />

      <select
        className="rounded-xl border border-gray-700 bg-gray-900 p-3 text-sm outline-none focus:border-blue-500"
        value={country}
        onChange={(e) => setCountry(e.target.value)}
      >
        <option value="">Selecciona país</option>

        {!countryOptions.includes(country) && country && (
          <option value={country}>{country}</option>
        )}

        {countryOptions.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>

      <button
        onClick={addProduct}
        className="rounded-xl bg-blue-600 p-3 text-sm font-semibold hover:bg-blue-500"
      >
        {editingId ? 'Actualizar producto' : 'Generar producto'}
      </button>

      {editingId && (
        <button
          onClick={clearForm}
          className="rounded-xl bg-gray-800 p-3 text-sm font-semibold hover:bg-gray-700"
        >
          Cancelar edición
        </button>
      )}
    </div>
  </div>

  <div className="grid gap-6 lg:col-span-2">
    <div className="rounded-2xl border border-gray-800 bg-gray-950 p-5">
      <h2 className="mb-4 text-lg font-bold">
        📊 Ventas por producto
      </h2>

      <div style={{ width: '100%', height: 320 }}>
        <ResponsiveContainer>
          <BarChart data={chartData}>
            <XAxis
              dataKey="name"
              interval={0}
              angle={-20}
              textAnchor="end"
              height={70}
            />
            <YAxis allowDecimals={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#111827',
                border: '1px solid #374151',
                borderRadius: '12px',
                color: '#ffffff'
              }}
              cursor={{ fill: '#1f2937' }}
            />
            <Bar
              dataKey="ventas"
              fill="#22c55e"
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>

    <div className="rounded-2xl border border-gray-800 bg-gray-950 p-5">
      <h2 className="mb-4 text-lg font-bold">
        💸 Profit por producto
      </h2>

      <div style={{ width: '100%', height: 320 }}>
        <ResponsiveContainer>
          <BarChart data={profitData}>
            <XAxis
              dataKey="name"
              interval={0}
              angle={-20}
              textAnchor="end"
              height={70}
            />
            <YAxis />
            <Tooltip
              contentStyle={{
                backgroundColor: '#111827',
                border: '1px solid #374151',
                borderRadius: '12px',
                color: '#ffffff'
              }}
              cursor={{ fill: '#1f2937' }}
            />
            <Bar
              dataKey="profit"
              fill="#f59e0b"
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  </div>
</section>

        <div className="mb-8 rounded-2xl border border-gray-800 bg-gray-950 p-5">
  <h2 className="mb-4 text-lg font-bold">
    📈 Ventas últimos 7 días
  </h2>

  <div style={{ width: '100%', height: 300 }}>
    <ResponsiveContainer>
      <BarChart data={dailySales}>
  <XAxis dataKey="dia" />
  <YAxis allowDecimals={false} />
  <Tooltip
    contentStyle={{
      backgroundColor: '#111827',
      border: '1px solid #374151',
      borderRadius: '12px',
      color: '#ffffff'
    }}
    cursor={{ fill: '#1f2937' }}
  />
  <Bar
    dataKey="ventas"
    fill="#3b82f6"
    radius={[8, 8, 0, 0]}
  />
</BarChart>
    </ResponsiveContainer>
  </div>
</div>

        {loading && (
          <p className="mb-4 text-gray-400">Cargando productos...</p>
        )}

        {filteredProducts.length === 0 && (
  <div className="rounded-2xl border border-gray-800 bg-gray-950 p-6 text-gray-400">
    No se encontraron productos con ese filtro o búsqueda.
  </div>
)}

<section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
  {filteredProducts.map((p) => (
            <div
              key={p.id}
              className="rounded-2xl border border-gray-800 bg-gray-950 p-5 transition hover:border-gray-700"
            >
              <div className="mb-3 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold">{p.name}</h2>
                  <p className="mt-1 text-sm text-gray-400">
                    {p.category} • {p.target_country}
                  </p>
                </div>

                <span className={`${getColor(p.decision_label)} whitespace-nowrap text-sm font-bold`}>
                  {p.decision_label}
                </span>
              </div>

              <div className="grid gap-2 rounded-xl bg-gray-900 p-4 text-sm">
                <p>💰 Precio: €{p.price_eur}</p>

<p>🏷 Costo: €{Number(p.cost_eur || 0).toFixed(2)}</p>
<p>📈 Margen: {Number(p.margin_percent || 0).toFixed(1)}%</p>
<p>💸 Profit unidad: €{Number(p.unit_profit || 0).toFixed(2)}</p>
<p>🧾 Profit total: €{Number(p.total_profit || 0).toFixed(2)}</p>

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

              {(() => {
  const recommendation = getRecommendation(p)

  return (
    <div className="mt-4 rounded-xl border border-gray-800 bg-gray-900 p-4 text-sm">
      <p className="mb-2 font-bold text-blue-300">
        🧠 Recomendación DropPilot
      </p>

      <p>
        <span className="text-gray-400">Acción:</span>{' '}
        {recommendation.action}
      </p>

      <p className="mt-1">
        <span className="text-gray-400">Motivo:</span>{' '}
        {recommendation.reason}
      </p>

      <p className="mt-1">
        <span className="text-gray-400">Siguiente paso:</span>{' '}
        {recommendation.nextStep}
      </p>
    </div>
  )
})()}

              <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
                <button
                  onClick={() => registerSale(p)}
                  className="rounded-xl bg-green-600 px-3 py-2 text-sm font-medium hover:bg-green-500"
                >
                  ➕ Venta
                </button>

                <button
                  onClick={() => editProduct(p)}
                  className="rounded-xl bg-yellow-600 px-3 py-2 text-sm font-medium hover:bg-yellow-500"
                >
                  ✏️ Editar
                </button>

                <button
                  onClick={() => deleteProduct(p.id)}
                  className="rounded-xl bg-red-700 px-3 py-2 text-sm font-medium hover:bg-red-600"
                >
                  🗑 Eliminar
                </button>
              </div>
            </div>
          ))}
        </section>
      </div>
    </div>
  )
}