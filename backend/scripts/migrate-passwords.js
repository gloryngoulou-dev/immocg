/**
 * Hash tous les mots de passe encore en clair.
 * Usage : npm run migrate-passwords
 */
require('dotenv').config()
const { createClient } = require('@supabase/supabase-js')
const { hashPassword, isHashed } = require('../utils/password')

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
)

async function main() {
  const { data: users, error } = await supabase.from('users').select('id, email, mot_de_passe')
  if (error) {
    console.error('Erreur:', error.message)
    process.exit(1)
  }

  let migrated = 0
  for (const user of users || []) {
    if (isHashed(user.mot_de_passe)) {
      console.log(`⏭️  ${user.email} — déjà hashé`)
      continue
    }
    const hashed = await hashPassword(user.mot_de_passe)
    const { error: upErr } = await supabase
      .from('users')
      .update({ mot_de_passe: hashed })
      .eq('id', user.id)
    if (upErr) {
      console.error(`❌ ${user.email}:`, upErr.message)
    } else {
      console.log(`✅ ${user.email} — mot de passe sécurisé`)
      migrated++
    }
  }
  console.log(`\nTerminé : ${migrated} compte(s) migré(s).`)
}

main()
