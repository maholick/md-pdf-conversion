'use client'

import React from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

export interface PandocConfig {
  outputFile: string
  tableOfContents: boolean
  tocDepth: number
  numberSections: boolean
  listings: boolean
  referenceLinks: boolean
}

export interface EisvogelConfig {
  title: string
  author: string
  date: string
  subject: string
  keywords: string[]
  subtitle: string
  lang: string
  titlepage: boolean
  fontsize: string
  mainfont?: string
}

interface ConfigEditorProps {
  pandocConfig: PandocConfig
  eisvogelConfig: EisvogelConfig
  onPandocChange: (config: PandocConfig) => void
  onEisvogelChange: (config: EisvogelConfig) => void
}

export function ConfigEditor({
  pandocConfig,
  eisvogelConfig,
  onPandocChange,
  onEisvogelChange
}: ConfigEditorProps) {
  return (
    <Tabs defaultValue="pandoc" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="pandoc">Pandoc Settings</TabsTrigger>
        <TabsTrigger value="eisvogel">Document Metadata</TabsTrigger>
      </TabsList>
      
      <TabsContent value="pandoc">
        <Card>
          <CardHeader>
            <CardTitle>Pandoc Configuration</CardTitle>
            <CardDescription>
              Control PDF generation settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="output">Output Filename</Label>
              <Input
                id="output"
                value={pandocConfig.outputFile}
                onChange={(e) => onPandocChange({ ...pandocConfig, outputFile: e.target.value })}
                placeholder="example.pdf"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="toc"
                checked={pandocConfig.tableOfContents}
                onChange={(e) => onPandocChange({ ...pandocConfig, tableOfContents: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="toc">Include Table of Contents</Label>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="tocDepth">TOC Depth</Label>
              <Input
                id="tocDepth"
                type="number"
                min="1"
                max="6"
                value={pandocConfig.tocDepth}
                onChange={(e) => onPandocChange({ ...pandocConfig, tocDepth: parseInt(e.target.value) })}
                disabled={!pandocConfig.tableOfContents}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="numberSections"
                checked={pandocConfig.numberSections}
                onChange={(e) => onPandocChange({ ...pandocConfig, numberSections: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="numberSections">Number Sections</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="listings"
                checked={pandocConfig.listings}
                onChange={(e) => onPandocChange({ ...pandocConfig, listings: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="listings">Enable Syntax Highlighting</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="referenceLinks"
                checked={pandocConfig.referenceLinks}
                onChange={(e) => onPandocChange({ ...pandocConfig, referenceLinks: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="referenceLinks">Use Reference-style Links</Label>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="eisvogel">
        <Card>
          <CardHeader>
            <CardTitle>Document Metadata</CardTitle>
            <CardDescription>
              Set document information and styling
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={eisvogelConfig.title}
                onChange={(e) => onEisvogelChange({ ...eisvogelConfig, title: e.target.value })}
                placeholder="Document Title"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="subtitle">Subtitle</Label>
              <Input
                id="subtitle"
                value={eisvogelConfig.subtitle}
                onChange={(e) => onEisvogelChange({ ...eisvogelConfig, subtitle: e.target.value })}
                placeholder="Document Subtitle"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="author">Author</Label>
              <Input
                id="author"
                value={eisvogelConfig.author}
                onChange={(e) => onEisvogelChange({ ...eisvogelConfig, author: e.target.value })}
                placeholder="Author Name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={eisvogelConfig.date}
                onChange={(e) => onEisvogelChange({ ...eisvogelConfig, date: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={eisvogelConfig.subject}
                onChange={(e) => onEisvogelChange({ ...eisvogelConfig, subject: e.target.value })}
                placeholder="Document Subject"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="keywords">Keywords (comma-separated)</Label>
              <Input
                id="keywords"
                value={eisvogelConfig.keywords.join(', ')}
                onChange={(e) => onEisvogelChange({ 
                  ...eisvogelConfig, 
                  keywords: e.target.value.split(',').map(k => k.trim()).filter(k => k)
                })}
                placeholder="keyword1, keyword2, keyword3"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="lang">Language</Label>
              <Input
                id="lang"
                value={eisvogelConfig.lang}
                onChange={(e) => onEisvogelChange({ ...eisvogelConfig, lang: e.target.value })}
                placeholder="en"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="fontsize">Font Size</Label>
              <select
                id="fontsize"
                value={eisvogelConfig.fontsize}
                onChange={(e) => onEisvogelChange({ ...eisvogelConfig, fontsize: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2"
              >
                <option value="10pt">10pt</option>
                <option value="11pt">11pt</option>
                <option value="12pt">12pt</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="mainfont">Main Font</Label>
              <select
                id="mainfont"
                value={eisvogelConfig.mainfont || 'default'}
                onChange={(e) => onEisvogelChange({ 
                  ...eisvogelConfig, 
                  mainfont: e.target.value === 'default' ? undefined : e.target.value 
                })}
                className="w-full rounded-md border border-gray-300 px-3 py-2"
              >
                <option value="default">Default (Latin Modern)</option>
                <optgroup label="Sans-Serif Fonts">
                  <option value="Open Sans">Open Sans</option>
                  <option value="Liberation Sans">Liberation Sans</option>
                  <option value="DejaVu Sans">DejaVu Sans</option>
                  <option value="FreeSans">FreeSans</option>
                  <option value="Noto Sans">Noto Sans</option>
                  <option value="Ubuntu">Ubuntu</option>
                  <option value="Cantarell">Cantarell</option>
                  <option value="Carlito">Carlito (Calibri-like)</option>
                  <option value="Arimo">Arimo (Arial-like)</option>
                </optgroup>
                <optgroup label="Serif Fonts">
                  <option value="Liberation Serif">Liberation Serif</option>
                  <option value="DejaVu Serif">DejaVu Serif</option>
                  <option value="FreeSerif">FreeSerif</option>
                  <option value="Noto Serif">Noto Serif</option>
                  <option value="Vollkorn">Vollkorn</option>
                  <option value="Tinos">Tinos (Times-like)</option>
                </optgroup>
                <optgroup label="Monospace Fonts">
                  <option value="Liberation Mono">Liberation Mono</option>
                  <option value="DejaVu Sans Mono">DejaVu Sans Mono</option>
                  <option value="FreeMono">FreeMono</option>
                  <option value="Noto Sans Mono">Noto Sans Mono</option>
                  <option value="Inconsolata">Inconsolata</option>
                  <option value="Hack">Hack</option>
                  <option value="Cousine">Cousine (Courier-like)</option>
                </optgroup>
                <optgroup label="Special">
                  <option value="Noto Color Emoji">Noto Color Emoji</option>
                  <option value="Font Awesome">Font Awesome (Icons)</option>
                </optgroup>
              </select>
              <p className="text-sm text-gray-500">
                20+ open source fonts from Alpine packages. Using XeLaTeX for better Unicode support.
              </p>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="titlepage"
                checked={eisvogelConfig.titlepage}
                onChange={(e) => onEisvogelChange({ ...eisvogelConfig, titlepage: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="titlepage">Include Title Page</Label>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}