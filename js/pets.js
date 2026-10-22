// PPAP-21 C01: list Available pets (name + photo), each linking to its profile.
import { supabase } from './supabase.js';

const statusEl = document.getElementById('status');
const listEl = document.getElementById('pet-list');

const { data: pets, error } = await supabase
  .from('pets')
  .select('pet_id, name, photo')
  .eq('availability', 'Available')
  .order('pet_id');

if (error) {
  console.error(error);
  statusEl.textContent = 'Sorry, pets could not be loaded. Please try again later.';
} else if (pets.length === 0) {
  statusEl.textContent = 'No pets are available right now.';
} else {
  statusEl.textContent = `${pets.length} pets available for adoption.`;
  for (const pet of pets) {
    const card = document.createElement('a');
    card.className = 'pet-card';
    card.href = `pet.html?id=${encodeURIComponent(pet.pet_id)}`;

    const img = document.createElement('img');
    img.src = pet.photo || '';
    img.alt = `Photo of ${pet.name}`;

    const name = document.createElement('h2');
    name.textContent = pet.name;

    card.append(img, name);
    listEl.append(card);
  }
}
