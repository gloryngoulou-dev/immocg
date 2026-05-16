/**
 * Corrige les incohérences connues dans la base Supabase.
 * Usage : node backend/scripts/fix-biens-data.js
 */
require('dotenv').config()
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
)

const corrections = [
  {
    id: 1,
    updates: { salles_bain: 2, parking: '1' },
    label: 'Villa Bacongo — salles de bain et parking',
  },
  {
    id: 2,
    updates: { meuble: 'Meublé' },
    label: 'Appartement Poto-Poto — statut meublé',
  },
]

async function main() {
  for (const { id, updates, label } of corrections) {
    const { error } = await supabase.from('biens').update(updates).eq('id', id)
    if (error) {
      console.error(`❌ ${label} :`, error.message)
    } else {
      console.log(`✅ ${label}`)
    }
  }
}

main()
