import { MDXRemote, type MDXRemoteSerializeResult } from 'next-mdx-remote'
import { serialize } from 'next-mdx-remote/serialize'
import remarkGfm from 'remark-gfm'
import rehypeSanitize from 'rehype-sanitize'
import { GovParamTable } from '@/components/governance/GovParamTable'
import { RiskAccordion } from '@/components/governance/RiskAccordion'
import { Callout } from '@/components/governance/Callout'
import { IPFSDocLink } from '@/components/governance/IPFSDocLink'

const components = {
  GovParamTable,
  RiskAccordion,
  Callout,
  IPFSDocLink,
  // Add custom styling for markdown elements with anchor links
  h1: (props: any) => {
    const id = props.children?.toString().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || ''
    return <h1 id={id} className="text-3xl font-bold mb-6 scroll-mt-24 group" {...props}>
      {props.children}
      <a href={`#${id}`} className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground" aria-label="Link to this section">
        #
      </a>
    </h1>
  },
  h2: (props: any) => {
    const id = props.children?.toString().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || ''
    return <h2 id={id} className="text-2xl font-semibold mb-4 mt-8 scroll-mt-24 group" {...props}>
      {props.children}
      <a href={`#${id}`} className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground" aria-label="Link to this section">
        #
      </a>
    </h2>
  },
  h3: (props: any) => {
    const id = props.children?.toString().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || ''
    return <h3 id={id} className="text-xl font-semibold mb-3 mt-6 scroll-mt-24 group" {...props}>
      {props.children}
      <a href={`#${id}`} className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground" aria-label="Link to this section">
        #
      </a>
    </h3>
  },
  h4: (props: any) => {
    const id = props.children?.toString().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || ''
    return <h4 id={id} className="text-lg font-semibold mb-2 mt-4 scroll-mt-24 group" {...props}>
      {props.children}
      <a href={`#${id}`} className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground" aria-label="Link to this section">
        #
      </a>
    </h4>
  },
  p: (props: any) => <p className="mb-4 leading-7" {...props} />,
  ul: (props: any) => <ul className="mb-4 ml-6 list-disc" {...props} />,
  ol: (props: any) => <ol className="mb-4 ml-6 list-decimal" {...props} />,
  li: (props: any) => <li className="mb-2" {...props} />,
  a: (props: any) => (
    <a 
      className="text-primary hover:underline" 
      target={props.href?.startsWith('http') ? '_blank' : undefined}
      rel={props.href?.startsWith('http') ? 'noopener noreferrer' : undefined}
      {...props} 
    />
  ),
  blockquote: (props: any) => (
    <blockquote className="border-l-4 border-muted pl-6 italic mb-4" {...props} />
  ),
  code: (props: any) => (
    <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono" {...props} />
  ),
  pre: (props: any) => (
    <pre className="bg-muted p-4 rounded-lg overflow-x-auto mb-4" {...props} />
  ),
  table: (props: any) => (
    <div className="overflow-x-auto mb-4">
      <table className="w-full border-collapse border border-border" {...props} />
    </div>
  ),
  th: (props: any) => (
    <th className="border border-border px-4 py-2 bg-muted font-semibold text-left" {...props} />
  ),
  td: (props: any) => (
    <td className="border border-border px-4 py-2" {...props} />
  ),
}

export async function serializeMDX(content: string): Promise<MDXRemoteSerializeResult> {
  return await serialize(content, {
    mdxOptions: {
      remarkPlugins: [remarkGfm],
      rehypePlugins: [rehypeSanitize],
      development: process.env.NODE_ENV === 'development',
    },
  })
}

export function MDXContent({ source }: { source: MDXRemoteSerializeResult }) {
  return <MDXRemote {...source} components={components} />
}