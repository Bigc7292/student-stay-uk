#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.local') });

console.log('🔍 Debugging Image Loading Issue\n');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const anonClient = createClient(supabaseUrl, supabaseAnonKey);
const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

async function debugImages() {
  try {
    console.log('1. 📊 Checking basic counts...');
    
    // Check total counts
    const { count: totalProps } = await serviceClient
      .from('properties')
      .select('*', { count: 'exact', head: true });
    
    const { count: totalImages } = await serviceClient
      .from('property_images')
      .select('*', { count: 'exact', head: true });
    
    console.log(`   Properties: ${totalProps}`);
    console.log(`   Images: ${totalImages}`);
    
    console.log('\n2. 🔗 Testing the exact query used by frontend...');
    
    // Test the exact query from supabasePropertyService
    const { data: frontendQuery, error: frontendError } = await anonClient
      .from('properties')
      .select(`
        *,
        property_images:property_images(*)
      `)
      .ilike('location', '%Glasgow%')
      .eq('available', true)
      .lte('price', 800)
      .order('price', { ascending: true })
      .order('created_at', { ascending: false })
      .limit(2);
    
    if (frontendError) {
      console.log('   ❌ Frontend query failed:', frontendError.message);
    } else {
      console.log(`   ✅ Frontend query returned ${frontendQuery?.length || 0} properties`);
      frontendQuery?.forEach((prop, idx) => {
        console.log(`   ${idx + 1}. ${prop.title}`);
        console.log(`      Images: ${prop.property_images?.length || 0}`);
        console.log(`      Property ID: ${prop.id}`);
      });
    }
    
    console.log('\n3. 🎯 Finding properties that definitely have images...');
    
    // Get property IDs that have images
    const { data: imageRefs } = await serviceClient
      .from('property_images')
      .select('property_id')
      .limit(5);
    
    const propertyIdsWithImages = [...new Set(imageRefs?.map(img => img.property_id) || [])];
    console.log(`   Found ${propertyIdsWithImages.length} unique property IDs with images`);
    
    if (propertyIdsWithImages.length > 0) {
      // Test join with known property that has images
      const { data: testProp, error: testError } = await anonClient
        .from('properties')
        .select(`
          *,
          property_images:property_images(*)
        `)
        .eq('id', propertyIdsWithImages[0])
        .single();
      
      if (testError) {
        console.log('   ❌ Test property query failed:', testError.message);
      } else {
        console.log(`   ✅ Test property: ${testProp.title}`);
        console.log(`      Location: ${testProp.location}`);
        console.log(`      Images: ${testProp.property_images?.length || 0}`);
        if (testProp.property_images?.length > 0) {
          console.log(`      First image: ${testProp.property_images[0].image_url}`);
        }
      }
    }
    
    console.log('\n4. 🔍 Checking if the issue is location-specific...');
    
    // Check if Glasgow properties specifically have images
    const { data: glasgowProps } = await serviceClient
      .from('properties')
      .select('id, title, location')
      .ilike('location', '%Glasgow%')
      .limit(5);
    
    console.log(`   Found ${glasgowProps?.length || 0} Glasgow properties`);
    
    for (const prop of glasgowProps || []) {
      const { count: imageCount } = await serviceClient
        .from('property_images')
        .select('*', { count: 'exact', head: true })
        .eq('property_id', prop.id);
      
      console.log(`   - ${prop.title.substring(0, 50)}...: ${imageCount} images`);
    }
    
  } catch (error) {
    console.log('❌ Debug failed:', error.message);
  }
}

debugImages()
  .then(() => {
    console.log('\n✅ Debug completed!');
    process.exit(0);
  })
  .catch(error => {
    console.log('❌ Debug failed:', error.message);
    process.exit(1);
  });
