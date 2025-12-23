/**
 * Script pour créer des données de test dans Supabase
 * Usage: npx ts-node scripts/seed-test-data.ts
 * 
 * Crée:
 * - 1 table d'exemple (Products)
 * - 4 champs (Name, Price, Category, In Stock)
 * - 5 records avec des données
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Erreur: SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requis')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function seedTestData() {
  try {
    console.log('🌱 Création de données de test...\n')

    // ===== 1. Get the first organization (workspace)
    console.log('📍 Récupération du workspace...')
    const { data: orgs, error: orgsError } = await supabase
      .from('organizations')
      .select('id, name')
      .limit(1)

    if (orgsError || !orgs || orgs.length === 0) {
      console.error('❌ Impossible de trouver une organisation:', orgsError)
      process.exit(1)
    }

    const workspaceId = orgs[0].id
    console.log(`✅ Workspace: ${orgs[0].name} (${workspaceId})\n`)

    // ===== 2. Create entity table: "Products"
    console.log('📋 Création de la table "Products"...')
    const { data: table, error: tableError } = await supabase
      .from('entity_tables')
      .insert({
        workspace_id: workspaceId,
        name: 'Products',
        description: 'Table de test avec produits',
      })
      .select('id')
      .single()

    if (tableError || !table) {
      console.error('❌ Erreur création table:', tableError)
      process.exit(1)
    }

    const tableId = table.id
    console.log(`✅ Table créée: ${tableId}\n`)

    // ===== 3. Create fields
    console.log('🔧 Création des champs...')
    const fieldsData = [
      {
        table_id: tableId,
        name: 'Product Name',
        type: 'text',
        order_index: 0,
        options: {},
      },
      {
        table_id: tableId,
        name: 'Price',
        type: 'number',
        order_index: 1,
        options: {},
      },
      {
        table_id: tableId,
        name: 'Category',
        type: 'select',
        order_index: 2,
        options: {
          choices: [
            { id: 'cat-1', label: 'Electronics', color: 'blue' },
            { id: 'cat-2', label: 'Clothing', color: 'purple' },
            { id: 'cat-3', label: 'Books', color: 'green' },
            { id: 'cat-4', label: 'Food', color: 'yellow' },
          ],
        },
      },
      {
        table_id: tableId,
        name: 'In Stock',
        type: 'boolean',
        order_index: 3,
        options: {},
      },
    ]

    const { data: fields, error: fieldsError } = await supabase
      .from('entity_fields')
      .insert(fieldsData)
      .select('id, name, order_index')

    if (fieldsError || !fields) {
      console.error('❌ Erreur création champs:', fieldsError)
      process.exit(1)
    }

    console.log(`✅ ${fields.length} champs créés:`)
    fields.forEach((f) => console.log(`   - ${f.name} (index: ${f.order_index})`))
    console.log()

    // Map field names to IDs for records
    const fieldMap: Record<string, string> = {}
    fields.forEach((f) => {
      fieldMap[f.name] = f.id
    })

    // ===== 4. Create records with test data
    console.log('📝 Création des records...')
    const recordsData = [
      {
        table_id: tableId,
        data: {
          [fieldMap['Product Name']]: 'MacBook Pro',
          [fieldMap['Price']]: 2499,
          [fieldMap['Category']]: 'cat-1', // Electronics
          [fieldMap['In Stock']]: true,
        },
      },
      {
        table_id: tableId,
        data: {
          [fieldMap['Product Name']]: 'T-Shirt Blue',
          [fieldMap['Price']]: 29.99,
          [fieldMap['Category']]: 'cat-2', // Clothing
          [fieldMap['In Stock']]: true,
        },
      },
      {
        table_id: tableId,
        data: {
          [fieldMap['Product Name']]: 'JavaScript Guide',
          [fieldMap['Price']]: 39.99,
          [fieldMap['Category']]: 'cat-3', // Books
          [fieldMap['In Stock']]: false,
        },
      },
      {
        table_id: tableId,
        data: {
          [fieldMap['Product Name']]: 'Organic Coffee',
          [fieldMap['Price']]: 12.99,
          [fieldMap['Category']]: 'cat-4', // Food
          [fieldMap['In Stock']]: true,
        },
      },
      {
        table_id: tableId,
        data: {
          [fieldMap['Product Name']]: 'Wireless Mouse',
          [fieldMap['Price']]: 79.99,
          [fieldMap['Category']]: 'cat-1', // Electronics
          [fieldMap['In Stock']]: true,
        },
      },
    ]

    const { data: records, error: recordsError } = await supabase
      .from('entity_records')
      .insert(recordsData)
      .select('id, created_at')

    if (recordsError || !records) {
      console.error('❌ Erreur création records:', recordsError)
      process.exit(1)
    }

    console.log(`✅ ${records.length} records créés\n`)

    // ===== 5. Display access info
    console.log('='.repeat(60))
    console.log('✅ DONNÉES DE TEST CRÉÉES AVEC SUCCÈS')
    console.log('='.repeat(60))
    console.log(`
📊 Table: Products
   ID: ${tableId}
   Workspace: ${workspaceId}
   
🔗 Accédez au tableau:
   /workspace/${workspaceId}/table/${tableId}

📋 Contenu:
   - ${fields.length} colonnes dynamiques
   - ${records.length} records
   
💡 Prochaines étapes:
   1. Lancer: npm run dev
   2. Se connecter
   3. Accéder au URL ci-dessus
   4. Vérifier que le tableau s'affiche correctement
`)
  } catch (error) {
    console.error('❌ Erreur:', error)
    process.exit(1)
  }
}

seedTestData()
