import { create } from 'zustand'
import { getData, setData, logAction } from '../utils/storage'

function makeStore(key, defaultVal = []) {
  return {
    get:    ()    => getData(key, defaultVal),
    set:    (val) => setData(key, val),
    save:   (val) => { setData(key, val); return val },
  }
}

export const useDataStore = create((set, get) => ({
  // ── refresh trigger ────────────────────────────────────────
  _tick: 0,
  refresh: () => set(s => ({ _tick: s._tick + 1 })),

  // ── Destinations ────────────────────────────────────────────
  getDestinations:  () => getData('destinations', []),
  saveDestinations: (list) => { setData('destinations', list); get().refresh() },

  addDestination: (item) => {
    const list = getData('destinations', [])
    const nd = { ...item, id: Date.now(), actif: true }
    const next = [...list, nd]
    setData('destinations', next)
    logAction('INSERT', 'destination', `Ajout: ${item.ville} (${item.code})`, nd)
    get().refresh()
    return nd
  },
  updateDestination: (id, changes) => {
    const list = getData('destinations', [])
    const idx  = list.findIndex(x => x.id === id)
    if (idx === -1) return
    const before = { ...list[idx] }
    list[idx] = { ...list[idx], ...changes }
    setData('destinations', list)
    logAction('UPDATE', 'destination', `Modification: ${list[idx].ville}`, { before, after: list[idx] })
    get().refresh()
  },
  deleteDestination: (id) => {
    const list = getData('destinations', [])
    const item = list.find(x => x.id === id)
    setData('destinations', list.filter(x => x.id !== id))
    logAction('DELETE', 'destination', `Suppression: ${item?.ville}`, item)
    get().refresh()
  },

  // ── Programmes ──────────────────────────────────────────────
  getProgrammes:  () => getData('programmes', []),
  saveProgrammes: (list) => { setData('programmes', list); get().refresh() },

  addProgramme: (item) => {
    const list = getData('programmes', [])
    const nd = { ...item, id: Date.now(), actif: true }
    setData('programmes', [...list, nd])
    logAction('INSERT', 'programme', `Ajout: ${item.nom} (${item.code})`, nd)
    get().refresh()
    return nd
  },
  updateProgramme: (id, changes) => {
    const list = getData('programmes', [])
    const idx  = list.findIndex(x => x.id === id)
    if (idx === -1) return
    const before = { ...list[idx] }
    list[idx] = { ...list[idx], ...changes }
    setData('programmes', list)
    logAction('UPDATE', 'programme', `Modification: ${list[idx].nom}`, { before, after: list[idx] })
    get().refresh()
  },
  deleteProgramme: (id) => {
    const list = getData('programmes', [])
    const item = list.find(x => x.id === id)
    setData('programmes', list.filter(x => x.id !== id))
    logAction('DELETE', 'programme', `Suppression: ${item?.nom}`, item)
    get().refresh()
  },

  // ── Clients (GI) ────────────────────────────────────────────
  getClients:  () => getData('clients', []),
  saveClients: (list) => { setData('clients', list); get().refresh() },

  addClient: (item) => {
    const list = getData('clients', [])
    const nd = { ...item, id: Date.now(), pax: [] }
    setData('clients', [...list, nd])
    logAction('INSERT', 'client_leader', `Ajout: ${item.titre} ${item.nom}`, nd)
    get().refresh()
    return nd
  },
  updateClient: (id, changes) => {
    const list = getData('clients', [])
    const idx  = list.findIndex(x => x.id === id)
    if (idx === -1) return
    const before = { ...list[idx] }
    list[idx] = { ...list[idx], ...changes }
    setData('clients', list)
    logAction('UPDATE', 'client_leader', `Modification: ${list[idx].nom}`, { before, after: list[idx] })
    get().refresh()
  },
  deleteClient: (id) => {
    const list = getData('clients', [])
    const item = list.find(x => x.id === id)
    setData('clients', list.filter(x => x.id !== id))
    logAction('DELETE', 'client_leader', `Suppression: ${item?.nom}`, item)
    get().refresh()
  },

  // ── Programme Clients (PC) ──────────────────────────────────
  getPCs:  () => getData('prog_clients', []),
  savePCs: (list) => { setData('prog_clients', list); get().refresh() },

  addPC: (item) => {
    const list = getData('prog_clients', [])
    const nd   = { ...item, id: Date.now() }
    setData('prog_clients', [...list, nd])
    logAction('INSERT', 'programme_client', `Nouveau PC: ${item.clientNom} → ${item.progNom}`, nd)
    get().refresh()
    return nd
  },
  updatePC: (id, changes) => {
    const list = getData('prog_clients', [])
    const idx  = list.findIndex(x => x.id === id)
    if (idx === -1) return
    const before = { ...list[idx] }
    list[idx] = { ...list[idx], ...changes }
    setData('prog_clients', list)
    logAction('UPDATE', 'programme_client', `Modification PC: ${list[idx].clientNom}`, { before, after: list[idx] })
    get().refresh()
  },
  deletePC: (id) => {
    const list = getData('prog_clients', [])
    const item = list.find(x => x.id === id)
    setData('prog_clients', list.filter(x => x.id !== id))
    logAction('DELETE', 'programme_client', `Suppression PC: ${item?.clientNom}`, item)
    get().refresh()
  },

  // ── Cotations ───────────────────────────────────────────────
  getCotations:  () => getData('cotations', {}),
  saveCotation:  (pcId, cot) => {
    const all = getData('cotations', {})
    all[pcId] = cot
    setData('cotations', all)
    logAction('UPDATE', 'cotation', `Cotation enregistrée — PC #${pcId}`, cot)
    useDataStore.getState().refresh()
  },

  // ── Factures Pro ────────────────────────────────────────────
  getFacturesPro: () => getData('factures_pro', {}),
  saveFacturePro: (pcId, fp) => {
    const all = getData('factures_pro', {})
    all[pcId] = fp
    setData('factures_pro', all)
    logAction('UPDATE', 'facture_pro', `Facture Pro enregistrée — PC #${pcId}`, fp)
    useDataStore.getState().refresh()
  },

  // ── Brieffings ──────────────────────────────────────────────
  getBrieffings:  () => getData('briefings', {}),
  saveBrieffing:  (pcId, brf) => {
    const all = getData('briefings', {})
    all[pcId] = brf
    setData('briefings', all)
    logAction('UPDATE', 'briefing', `Brieffing enregistré — PC #${pcId}`, brf)
    useDataStore.getState().refresh()
  },

  // ── Provisions ──────────────────────────────────────────────
  getProvisions:  () => getData('provisions', {}),
  saveProvision:  (pcId, prov) => {
    const all = getData('provisions', {})
    all[pcId] = prov
    setData('provisions', all)
    logAction('UPDATE', 'provision', `Provision enregistrée — PC #${pcId}`, prov)
    useDataStore.getState().refresh()
  },

  // ── Factures Définitives ────────────────────────────────────
  getFacturesDef: () => getData('factures_def', {}),
  saveFactureDef: (pcId, fd) => {
    const all = getData('factures_def', {})
    all[pcId] = fd
    setData('factures_def', all)
    logAction('UPDATE', 'facture_definitive', `Facture Déf enregistrée — PC #${pcId}`, fd)
    useDataStore.getState().refresh()
  },

  // ── Paiements ───────────────────────────────────────────────
  getPaiements:  () => getData('paiements', {}),
  addPaiement:   (pcId, pmt) => {
    const all = getData('paiements', {})
    if (!all[pcId]) all[pcId] = []
    all[pcId].push({ ...pmt, id: Date.now() })
    setData('paiements', all)
    logAction('INSERT', 'paiement_client', `Paiement ${pmt.montant}€ — ${pmt.type}`, pmt)
    useDataStore.getState().refresh()
  },
  deletePaiement: (pcId, pmtId) => {
    const all = getData('paiements', {})
    if (all[pcId]) all[pcId] = all[pcId].filter(p => p.id !== pmtId)
    setData('paiements', all)
    logAction('DELETE', 'paiement_client', `Suppression paiement #${pmtId}`, { pcId, pmtId })
    useDataStore.getState().refresh()
  },

  // ── Utilisateurs ────────────────────────────────────────────
  getUsers:  () => getData('users_admin', []),
  saveUsers: (list) => { setData('users_admin', list); useDataStore.getState().refresh() },

  addUser: (item) => {
    const list = getData('users_admin', [])
    const nd   = { ...item, id: Date.now(), actif: true, created: new Date().toISOString().split('T')[0] }
    setData('users_admin', [...list, nd])
    logAction('INSERT', 'utilisateur', `Ajout: ${item.prenom} ${item.nom} (${item.dept})`, nd)
    useDataStore.getState().refresh()
    return nd
  },
  updateUser: (id, changes) => {
    const list = getData('users_admin', [])
    const idx  = list.findIndex(x => x.id === id)
    if (idx === -1) return
    const before = { ...list[idx] }
    list[idx] = { ...list[idx], ...changes }
    setData('users_admin', list)
    logAction('UPDATE', 'utilisateur', `Modification: ${list[idx].login}`, { before, after: list[idx] })
    useDataStore.getState().refresh()
  },
  deleteUser: (id) => {
    const list = getData('users_admin', [])
    const item = list.find(x => x.id === id)
    setData('users_admin', list.filter(x => x.id !== id))
    logAction('DELETE', 'utilisateur', `Suppression: ${item?.login}`, item)
    useDataStore.getState().refresh()
  },

  // ── Constantes ──────────────────────────────────────────────
  getConstantes:  () => getData('constantes', { tauxChange:4800, tvaRate:20, devise:'EUR', deviseLocal:'MGA' }),
  saveConstantes: (c)  => {
    setData('constantes', c)
    logAction('UPDATE', 'constantes', 'Mise à jour des constantes système', c)
    useDataStore.getState().refresh()
  },

  // ── Audit ───────────────────────────────────────────────────
  getAudit: () => getData('audit', []),
}))
