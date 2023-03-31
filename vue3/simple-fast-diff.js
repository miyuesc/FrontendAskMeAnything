const isSameVNodeType = (n1, n2) => (n1 === n2)
const unmount = (node) => console.log('unmount', node)
const patch = (n1, n2) => console.log('patch', n1, n2)
// https://en.wikipedia.org/wiki/Longest_increasing_subsequence
function getSequence(arr) {
  const p = arr.slice()
  const result = [0]
  let i, j, u, v, c
  const len = arr.length
  for (i = 0; i < len; i++) {
    const arrI = arr[i]
    if (arrI !== 0) {
      j = result[result.length - 1]
      if (arr[j] < arrI) {
        p[i] = j
        result.push(i)
        continue
      }
      u = 0
      v = result.length - 1
      while (u < v) {
        c = (u + v) >> 1
        if (arr[result[c]] < arrI) {
          u = c + 1
        } else {
          v = c
        }
      }
      if (arrI < arr[result[u]]) {
        if (u > 0) {
          p[i] = result[u - 1]
        }
        result[u] = i
      }
    }
  }
  u = result.length
  v = result[u - 1]
  while (u-- > 0) {
    result[u] = v
    v = p[v]
  }
  return result
}


// 正式开始
// 定义新旧节点数据
const c1 = ['a', 'b', 'c', 'd', 'e', 'f', 'g']
const c2 = ['a', 'b', 'e', 'd', 'h', 'f', 'g']

// 设置初始数据
let i = 0
const l2 = c2.length
let e1 = c1.length - 1 // prev ending index
let e2 = l2 - 1 // next ending index

// 1. sync from start
while (i <= e1 && i <= e2) {
	const n1 = c1[i]
	const n2 = c2[i]
	if (isSameVNodeType(n1, n2)) {
		patch(n1, n2)
	} else {
		break
	}
	i++
}

// 2. sync from end
while (i <= e1 && i <= e2) {
	const n1 = c1[i]
	const n2 = c2[i]
	if (isSameVNodeType(n1, n2)) {
		patch(n1, n2)
	} else {
		break
	}
	e1--
	e2--
}

// 3. common sequence + mount
if (i > e1) {
	if (i <= e2) {
		const nextPos = e2 + 1
		while (i <= e2) {
			patch(null, c2[i])
			i++
		}
	}
}

// 4. common sequence + unmount
else if (i > e2) {
	while (i <= e1) {
		unmount(c1[i])
		i++
	}
}

// 5. unknown sequence
else {
	const s1 = i // prev starting index
	const s2 = i // next starting index

	// 5.1 build key:index map for newChildren
	const keyToNewIndexMap = new Map()
	for (i = s2; i <= e2; i++) {
        const nextChild = c2[i]
        if (nextChild != null) {
          	keyToNewIndexMap.set(nextChild, i)
        }
  	}

  	// 5.2 loop through old children left to be patched and try to patch
  	// matching nodes & remove nodes that are no longer present
  	let j
	let patched = 0
	const toBePatched = e2 - s2 + 1
	let moved = false
	let maxNewIndexSoFar = 0
	const newIndexToOldIndexMap = new Array(toBePatched)

	for (i = 0; i < toBePatched; i++) {
		newIndexToOldIndexMap[i] = 0
	}

	for (i = s1; i <= e1; i++) {
		const prevChild = c1[i]
		if (patched >= toBePatched) {
          	// all new children have been patched so this can only be a removal
			unmount(prevChild)
          	continue
        }

        let newIndex
        if (prevChild != null) {
          	newIndex = keyToNewIndexMap.get(prevChild)
        } else {
        	// key-less node, try to locate a key-less node of the same type
        	for (j = s2; j <= e2; j++) {
	            if (
	              newIndexToOldIndexMap[j - s2] === 0 &&
	              isSameVNodeType(prevChild, c2[j])
	            ) {
	              newIndex = j
	              break
	            }
          	}
        }

        if (newIndex === undefined) {
          	unmount(prevChild)
        } else {
			newIndexToOldIndexMap[newIndex - s2] = i + 1
			if (newIndex >= maxNewIndexSoFar) {
				maxNewIndexSoFar = newIndex
			} else {
				moved = true
			}
			patch(prevChild, c2[newIndex])
			patched++
        }
	}

	// 5.3 move and mount
	const increasingNewIndexSequence = moved ? getSequence(newIndexToOldIndexMap) : []
	j = increasingNewIndexSequence.length - 1
	for (i = toBePatched - 1; i >= 0; i--) {
		const nextIndex = s2 + i
		const nextChild = c2[nextIndex]
		if (newIndexToOldIndexMap[i] === 0) {
			// mount new
			patch(null, nextChild)
		} else if (moved) {
			if (j < 0 || i !== increasingNewIndexSequence[j]) {
		    	// move(nextChild, container, anchor, MoveType.REORDER)
		   		console.log('move', nextChild)
		  	} else {
		  		j--
		  	}
		}
	}
}
