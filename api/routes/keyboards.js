const { Router } = require('express')
const zmk = require('../services/zmk')

const router = Router()

router.get('/behaviors', (req, res) => res.json(zmk.loadBehaviors()))
router.get('/custbehaviors', (req, res) => res.json(zmk.loadCustomBehaviors()))
router.get('/keycodes', (req, res) => res.json(zmk.loadKeycodes()))
router.get('/custkeycodes', (req, res) => res.json(zmk.loadCustomKeycodes()))
router.get('/layout', (req, res) => res.json(zmk.loadLayout()))
router.get('/keymap', (req, res) => res.json(zmk.loadKeymap()))
router.get('/macro', (req, res) => res.json(zmk.loadMacro()))
router.post('/keymap', (req, res) => {
  const keymap = req.body
  const layout = zmk.loadLayout()
  const generatedKeymap = zmk.generateKeymap(layout, keymap)
  const exportStdout = zmk.exportKeymap(generatedKeymap, 'flash' in req.query, err => {
    if (err) {
      res.status(500).send(err)
      return
    }

    res.send()
  })

  // exportStdout.stdout.on('data', data => {
  //   for (let sub of subscribers) {
  //     sub.send(data)
  //   }
  // })
})
router.post('/macro', (req, res) => {
  const macro = req.body
  const generatedMacro = zmk.generateMacro(macro)
  const exportStdout = zmk.exportMacro(generatedMacro, 'flash' in req.query, err => {
    if (err) {
      res.status(500).send(err)
      return
    }

    res.send()
  })

  // exportStdout.stdout.on('data', data => {
  //   for (let sub of subscribers) {
  //     sub.send(data)
  //   }
  // })
})
router.post('/custkeycodes', (req, res) => {
  const keycodes = req.body
  const generated = zmk.generateCustKeycodes(keycodes)
  const exportStdout = zmk.exportCustKeycodes(generated, 'flash' in req.query, err => {
    if (err) {
      res.status(500).send(err)
      return
    }

    res.send()
  })
})
router.post('/custbehaviors', (req, res) => {
  const behaviors = req.body
  const generated = zmk.generateCustBehaviors(behaviors)
  const exportStdout = zmk.exportCustBehaviors(generated, 'flash' in req.query, err => {
    if (err) {
      res.status(500).send(err)
      return
    }

    res.send()
  })
})

module.exports = router
