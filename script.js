
    (()=>{
      // state
      const STORAGE_KEY = 'minha_lista_de_coisas_v1'
      let tasks = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
      let filter = 'all'

      // elements
      const listEl = document.getElementById('list')
      const form = document.getElementById('form')
      const inputText = document.getElementById('inputText')
      const inputDate = document.getElementById('inputDate')
      const inputPrio = document.getElementById('inputPrio')
      const countEl = document.getElementById('count')
      const clearBtn = document.getElementById('clearCompleted')
      const exportBtn = document.getElementById('export')
      const filters = document.querySelectorAll('.filters button')

      // helpers
      const save = ()=> localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
      const uid = ()=> Date.now().toString(36) + Math.random().toString(36).slice(2,8)
      const formatDate = d => d ? new Date(d).toLocaleDateString() : ''

      // render
      function render(){
        listEl.innerHTML = ''
        const visible = tasks.filter(t => {
          if(filter==='all') return true
          if(filter==='active') return !t.done
          return t.done
        })
        if(visible.length===0){
          listEl.innerHTML = '<div class="empty">Nenhuma tarefa encontrada — adicione uma acima ✨</div>'
        } else {
          visible.forEach(t => listEl.appendChild(createTaskNode(t)))
        }
        countEl.textContent = `${tasks.filter(t=>!t.done).length} tarefas pendentes`;
        save()
      }

      // create DOM node for task
      function createTaskNode(task){
        const el = document.createElement('div')
        el.className = 'task' + (task.done? ' done':'')
        el.draggable = true
        el.dataset.id = task.id

        el.innerHTML = `
          <div class="handle" title="Arrastar">☰</div>
          <input type="checkbox" class="toggle" ${task.done? 'checked':''} aria-label="Marcar tarefa" />
          <div class="title"><input type="text" value="${escapeHtml(task.text)}"/></div>
          <div class="meta">
            <div class="chip ${prioClass(task.prio)}">${prioLabel(task.prio)}</div>
            <div class="chip">${task.date ? formatDate(task.date) : ''}</div>
            <button class="ghost btn-edit" title="Editar">✎</button>
            <button class="ghost btn-delete" title="Excluir">🗑</button>
          </div>
        `

        // events
        const checkbox = el.querySelector('.toggle')
        const input = el.querySelector('.title input')
        const del = el.querySelector('.btn-delete')

        checkbox.addEventListener('change', ()=>{
          toggleDone(task.id)
        })

        // inline edit: on blur or enter save
        input.addEventListener('keydown', (e)=>{
          if(e.key==='Enter'){ input.blur() }
          if(e.key==='Escape'){ input.value = task.text; input.blur() }
        })
        input.addEventListener('blur', ()=>{
          updateText(task.id, input.value.trim())
        })

        del.addEventListener('click', ()=>{
          remove(task.id)
        })

        // drag handlers
        el.addEventListener('dragstart', (e)=>{
          e.dataTransfer.setData('text/plain', task.id)
          el.classList.add('dragging')
        })
        el.addEventListener('dragend', ()=> el.classList.remove('dragging'))

        return el
      }

      // CRUD
      function add(text, prio='low', date=''){
        if(!text) return
        tasks.push({id:uid(), text, prio, date, done:false})
        render()
      }
      function remove(id){ tasks = tasks.filter(t=>t.id!==id); render() }
      function toggleDone(id){ tasks = tasks.map(t=> t.id===id? {...t, done: !t.done}: t); render() }
      function updateText(id, text){ tasks = tasks.map(t=> t.id===id? {...t, text: text || t.text}: t); render() }

      // reorder via drag and drop
      listEl.addEventListener('dragover', (e)=>{
        e.preventDefault()
        const after = getDragAfterElement(e.clientY)
        const dragging = document.querySelector('.dragging')
        if(!dragging) return
        if(after == null) listEl.appendChild(dragging)
        else listEl.insertBefore(dragging, after)
      })

      listEl.addEventListener('drop', (e)=>{
        e.preventDefault()
        const id = e.dataTransfer.getData('text/plain')
        const nodes = Array.from(listEl.querySelectorAll('.task'))
        tasks = nodes.map(n => tasks.find(t=> t.id === n.dataset.id)).filter(Boolean)
        render()
      })

      function getDragAfterElement(y){
        const draggableElements = [...listEl.querySelectorAll('.task:not(.dragging)')]
        return draggableElements.reduce((closest, child) =>{
          const box = child.getBoundingClientRect()
          const offset = y - box.top - box.height/2
          if(offset < 0 && offset > closest.offset) {
            return {offset, element: child}
          } else return closest
        }, {offset: Number.NEGATIVE_INFINITY}).element
      }

      // helpers for priority labels
      function prioLabel(p){ return p==='high' ? 'Alta' : p==='medium' ? 'Média' : 'Baixa' }
      function prioClass(p){ return p==='high' ? 'prio-high' : p==='medium' ? 'prio-med' : 'prio-low' }

      // escape HTML
      function escapeHtml(str){ return String(str).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch])) }

      // form submit
      form.addEventListener('submit', (e)=>{
        e.preventDefault()
        add(inputText.value.trim(), inputPrio.value, inputDate.value)
        form.reset(); inputText.focus()
      })

      // filters
      filters.forEach(btn => btn.addEventListener('click', ()=>{
        filters.forEach(b=>b.classList.remove('active'))
        btn.classList.add('active')
        filter = btn.dataset.filter
        render()
      }))

      // clear completed
      clearBtn.addEventListener('click', ()=>{
        tasks = tasks.filter(t=> !t.done)
        render()
      })

      // export JSON
      exportBtn.addEventListener('click', ()=>{
        const blob = new Blob([JSON.stringify(tasks, null, 2)], {type:'application/json'})
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url; a.download = 'minha_lista.json'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url)
      })

      // keyboard shortcut: N to focus input
      window.addEventListener('keydown', (e)=>{
        if(e.key.toLowerCase()==='n' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA'){
          e.preventDefault(); inputText.focus()
        }
      })

      // initial render
      render()
    })()