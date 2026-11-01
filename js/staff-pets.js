// PPAP-12 E02: staff see all pets (Available and Unavailable) and change a pet's availability.
// Requires the staff sign-in from staff.html (pet updates are staff-only under RLS).
// pets.html lists Available pets only, so a pet set to Unavailable leaves the public listing.
import { supabase } from './supabase.js';

const statusEl = document.getElementById('status');
const staffArea = document.getElementById('staff-area');
const rowsEl = document.getElementById('pet-rows');
const saveMessage = document.getElementById('save-message');

function showSaveMessage(text, isError) {
  saveMessage.textContent = text;
  saveMessage.className = isError ? 'message error' : 'message success';
  saveMessage.hidden = false;
}

function showMessage(html) {
  staffArea.hidden = true;
  statusEl.innerHTML = html;
  statusEl.className = 'message';
  statusEl.hidden = false;
}

function buildRow(pet) {
  const row = document.createElement('tr');
  for (const value of [pet.pet_id, pet.name, pet.animal_type, pet.availability]) {
    const cell = document.createElement('td');
    cell.textContent = value;
    row.append(cell);
  }

  const form = document.createElement('form');
  form.className = 'inline-form';
  const select = document.createElement('select');
  select.name = 'availability';
  select.setAttribute('aria-label', `New availability for ${pet.name}`);
  for (const option of ['Available', 'Unavailable']) {
    select.append(new Option(option, option, false, option === pet.availability));
  }
  const button = document.createElement('button');
  button.className = 'button';
  button.type = 'submit';
  button.textContent = 'Save';
  form.append(select, button);
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    saveAvailability(pet, select.value, button);
  });

  const formCell = document.createElement('td');
  formCell.append(form);
  row.append(formCell);
  return row;
}

async function loadPets() {
  const { data: pets, error } = await supabase
    .from('pets')
    .select('pet_id, name, animal_type, availability')
    .order('pet_id');

  if (error) {
    console.error(error);
    showMessage('Sorry, pets could not be loaded. Please <a href="staff.html">sign in again</a>.');
    return;
  }

  rowsEl.replaceChildren(...pets.map(buildRow));
  const available = pets.filter((p) => p.availability === 'Available').length;
  statusEl.textContent = `${pets.length} pets: ${available} Available, ${pets.length - available} Unavailable.`;
  statusEl.className = 'muted';
  staffArea.hidden = false;
}

async function saveAvailability(pet, newAvailability, button) {
  saveMessage.hidden = true;
  button.disabled = true;

  // .select() returns the updated rows; zero rows means RLS blocked the update (e.g. session expired).
  const { data: updated, error } = await supabase
    .from('pets')
    .update({ availability: newAvailability })
    .eq('pet_id', pet.pet_id)
    .select('pet_id, name, availability');

  button.disabled = false;
  if (error || !updated || updated.length === 0) {
    if (error) console.warn('Availability not saved:', error.message);
    showSaveMessage('Please sign in again.', true);
    return;
  }

  // Reload from the database so the table shows the saved values, not the form values.
  await loadPets();
  const saved = updated[0];
  showSaveMessage(`Saved. ${saved.name} (${saved.pet_id}) is now ${saved.availability}.`, false);
}

const { data: { session } } = await supabase.auth.getSession();
if (!session) {
  showMessage('Staff sign-in is required. Please <a href="staff.html">sign in on the staff page</a> first.');
} else {
  loadPets();
}
