import { describe, expect, it } from 'vitest'
import { normalizeGithubRepo } from '@/lib/github'

describe('normalizeGithubRepo', () => {
  it('accepts owner/repo shorthand', () => {
    expect(normalizeGithubRepo('joes9987/pm-joes9987')).toBe('joes9987/pm-joes9987')
  })

  it('normalizes https github URLs', () => {
    expect(normalizeGithubRepo('https://github.com/joes9987/pm-joes9987')).toBe('joes9987/pm-joes9987')
    expect(normalizeGithubRepo('https://github.com/joes9987/pm-joes9987.git')).toBe('joes9987/pm-joes9987')
  })

  it('normalizes http and www variants', () => {
    expect(normalizeGithubRepo('http://www.github.com/org/repo/')).toBe('org/repo')
  })

  it('rejects invalid input', () => {
    expect(normalizeGithubRepo('')).toBeNull()
    expect(normalizeGithubRepo('   ')).toBeNull()
    expect(normalizeGithubRepo('not-a-repo')).toBeNull()
    expect(normalizeGithubRepo('owner/')).toBeNull()
  })
})
