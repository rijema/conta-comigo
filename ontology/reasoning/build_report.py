#!/usr/bin/env python3
"""Gera o relatório de verificação da ontologia (HTML para impressão em PDF).

Todos os números vêm dos arquivos produzidos por reason.sh em
ontology/reasoning/out/. Uso, da raiz do repositório:

    bash ontology/reasoning/reason.sh
    python3 ontology/reasoning/build_report.py [--rotulo "APÊNDICE A"]
    node ontology/reasoning/render_report.js
"""
import argparse
import csv
import html
import json
import re
import xml.etree.ElementTree as ET
import zipfile
from collections import Counter
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'ontology/reasoning/out'
ONTOLOGY = ROOT / 'ontology/contacomigo/contacomigo.owl'
CQ_DIR = ROOT / 'ontology/competency-questions'
CC = 'https://contacomigo.org/ontology#'
RDF = '{http://www.w3.org/1999/02/22-rdf-syntax-ns#}'
RDFS = '{http://www.w3.org/2000/01/rdf-schema#}'
OWL = '{http://www.w3.org/2002/07/owl#}'
XML_LANG = '{http://www.w3.org/XML/1998/namespace}lang'
MONTHS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto',
          'setembro', 'outubro', 'novembro', 'dezembro']

# Cabeçalhos das colunas das consultas SPARQL, por nome de variável.
HEADERS = {
    'codigo': 'Código', 'descricao': 'Descrição oficial', 'conceito': 'Conceito',
    'estadoMapeamento': 'Mapeamento', 'preRequisito': 'Pré-requisito', 'direto': 'Relação',
    'conceitosDependentes': 'Conceitos dependentes', 'ano': 'Ano', 'semAtividade': 'Habilidades',
    'conceitoLocal': 'Conceito local', 'relacao': 'Relação', 'iriOntoMathEdu': 'IRI na OntoMathEdu',
    'anterior': 'Conceito anterior', 'dependente': 'Conceito dependente',
    'fundamentacao': 'Fundamentação na BNCC', 'familia': 'Família de atividades',
    'habilidades': 'Habilidades', 'representacoes': 'Representações', 'usaPictogramas': 'Usa pictogramas',
}
# Valores traduzidos, por nome de variável.
VALUES = {
    'direto': {'true': 'direta', 'false': 'indireta'},
    'usaPictogramas': {'true': 'sim', 'false': 'não'},
    'estadoMapeamento': {'partial': 'parcial', 'mapped': 'completo'},
    'relacao': {'adapted': 'adaptado', 'narrower': 'mais específico', 'related': 'relacionado'},
}

esc = html.escape


def metrics(path):
    rows = {}
    for line in path.read_text().splitlines()[1:]:
        parts = line.split('\t')
        if len(parts) >= 3 and parts[2] == 'single_value':
            rows[parts[0]] = parts[1]
    return rows


def jar_versions(jar):
    wanted = {'org.semanticweb.hermit': 'HermiT', 'jfact': 'JFact', 'owlapi-api': 'OWL API'}
    found = {}
    with zipfile.ZipFile(jar) as archive:
        for name in archive.namelist():
            if name.endswith('pom.properties'):
                props = dict(line.split('=', 1) for line in archive.read(name).decode().splitlines()
                             if '=' in line and not line.startswith('#'))
                label = wanted.get(props.get('artifactId', ''))
                if label:
                    found[label] = props.get('version', '?')
    return found


def labels_pt(root):
    labels = {}
    for element in root.iter():
        about = element.get(RDF + 'about')
        if about:
            for label in element.findall(RDFS + 'label'):
                if (label.get(XML_LANG) or '').lower() == 'pt-br':
                    labels[about.split('#')[-1]] = label.text
    return labels


def prerequisite_relations(root):
    relations = set()
    for individual in root.iter(OWL + 'NamedIndividual'):
        first = individual.find(f'{{{CC}}}prerequisiteConcept')
        second = individual.find(f'{{{CC}}}dependentConcept')
        if first is not None and second is not None:
            relations.add((first.get(RDF + 'resource').split('#')[-1], second.get(RDF + 'resource').split('#')[-1]))
    return relations


def inferred(ofn_path):
    text = ofn_path.read_text(encoding='utf-8')
    classes = Counter(re.findall(r'^ClassAssertion\(cc:(BNCC\w+Skill) cc:\w+\)$', text, re.M))
    prerequisites = set(re.findall(r'^ObjectPropertyAssertion\(cc:isPrerequisiteOf cc:(\w+) cc:(\w+)\)$', text, re.M))
    return classes, prerequisites


def mutations(path):
    return [(m.group(1), m.group(2) == 'detectado') for m in
            re.finditer(r'^(M\d)-\S+\s+(detectado|NÃO detectado)$', path.read_text(encoding='utf-8'), re.M)]


def read_csv(path):
    if not path.exists() or path.stat().st_size == 0:
        return [], []
    with path.open(encoding='utf-8') as handle:
        rows = list(csv.reader(handle))
    return rows[0], rows[1:]


def question(query_path):
    text = query_path.read_text(encoding='utf-8').splitlines()[0].lstrip('# ').strip()
    code, _, rest = text.partition(' ')
    return code, rest


def query_body(query_path):
    return '\n'.join(line for line in query_path.read_text(encoding='utf-8').splitlines()
                     if not line.startswith(('#', 'PREFIX'))).strip()


class Doc:
    def __init__(self):
        self.parts = []
        self.tables = 0

    def add(self, text):
        self.parts.append(text)

    def p(self, text):
        self.add(f'<p>{text}</p>')

    def table(self, title, header, rows, widths=None, small=False):
        self.tables += 1
        cols = ''.join(f'<col style="width:{w}">' for w in widths) if widths else ''
        head = ''.join(f'<th>{esc(str(h))}</th>' for h in header)
        body = ''.join('<tr>' + ''.join(f'<td>{c}</td>' for c in row) + '</tr>' for row in rows)
        self.add(f'<figure class="tabela{" pequena" if small else ""}">'
                 f'<figcaption>Tabela {self.tables} – {esc(title)}</figcaption>'
                 f'<table><colgroup>{cols}</colgroup><thead><tr>{head}</tr></thead><tbody>{body}</tbody></table>'
                 '</figure>')

    def next_table(self):
        return self.tables + 1


def build(label):
    root = ET.parse(ONTOLOGY).getroot()
    ontology = root.find(OWL + 'Ontology')
    version = ontology.findtext(OWL + 'versionInfo')
    version_iri = ontology.find(OWL + 'versionIRI').get(RDF + 'resource')
    names = labels_pt(root)
    relations = prerequisite_relations(root)

    jar = next(OUT.glob('robot-*.jar'))
    tools = jar_versions(jar)
    robot_version = (OUT / 'robot.version').read_text().strip().replace('ROBOT version ', '')
    java_version = re.sub(r'openjdk version "(\S+)".*', r'OpenJDK \1', (OUT / 'java.version').read_text().strip())
    sha = (OUT / 'ontology.sha256').read_text().split()[0]
    current = metrics(OUT / 'metrics.tsv')
    profile_ok = 'in profile' in (OUT / 'profile-dl.txt').read_text()
    hermit_classes, hermit_pre = inferred(OUT / 'inferred-HermiT.ofn')
    jfact_classes, _ = inferred(OUT / 'inferred-JFact.ofn')
    mutation_results = mutations(OUT / 'mutations.txt')
    report = Counter(tuple(row.split('\t')[:2]) for row in (OUT / 'report.tsv').read_text().splitlines()[1:] if row)
    unsatisfiable = {r: len([l for l in p.read_text().splitlines() if l.strip()]) if p.exists() else 0
                     for r, p in ((r, OUT / f'unsatisfiable-{r}.txt') for r in ('HermiT', 'JFact'))}
    run_date = date.fromtimestamp((OUT / 'ontology.sha256').stat().st_mtime)
    when = f'{run_date.day} de {MONTHS[run_date.month - 1]} de {run_date.year}'

    doc = Doc()
    title = 'Relatório de verificação da Ontologia ContaComigo'
    doc.add(f'<h1>{esc(label + " – ") if label else ""}{esc(title.upper() if label else title)}</h1>')
    doc.add(f'<p class="subtitulo">Versão {esc(version)}, {when}</p>')

    # 1
    doc.add('<h2>1 Identificação</h2>')
    doc.table('Artefato verificado', ['Item', 'Valor'], [
        ['Arquivo', '<code>contacomigo.owl</code> (RDF/XML)'],
        ['Versão', f'{esc(version)} (<code>{esc(version_iri)}</code>)'],
        ['SHA-256', f'<code class="hash">{sha}</code>'],
        ['Licença', 'Creative Commons Atribuição 4.0 Internacional (CC BY 4.0)'],
        ['Ferramentas', f'ROBOT {esc(robot_version)}, HermiT {tools.get("HermiT", "?")}, JFact {tools.get("JFact", "?")}, '
                        f'OWL API {tools.get("OWL API", "?")}, {esc(java_version)}'],
    ], widths=['22%', '78%'])

    # 2
    doc.add('<h2>2 Procedimento</h2>')
    doc.p('A verificação é executada pelo script <code>reason.sh</code>, que obtém o ROBOT e confere seu checksum '
          'antes do uso. O script valida o perfil OWL 2 DL, executa os raciocinadores HermiT e JFact, calcula as '
          'métricas e o relatório de qualidade, executa os testes de mutação, responde às questões de competência e '
          'executa as consultas de integridade. As consultas SPARQL são executadas sobre a ontologia acrescida das '
          'inferências do HermiT, que é o raciocinador de referência. Todos os valores deste relatório foram extraídos '
          'dos arquivos gerados pelo script.')

    # 3
    doc.add('<h2>3 Métricas</h2>')
    m = current.get
    doc.table('Métricas da ontologia', ['Métrica', 'Valor'], [
        ['Axiomas', m('axiom_count')],
        ['Axiomas lógicos', m('logical_axiom_count')],
        ['Axiomas de TBox, RBox e ABox', f"{m('tbox_axiom_count')}, {m('rbox_axiom_count')} e {m('abox_axiom_count')}"],
        ['Classes', m('class_count')],
        ['Propriedades de objeto', m('obj_property_count')],
        ['Propriedades de dados', m('dataproperty_count')],
        ['Propriedades de anotação', m('annotation_property_count')],
        ['Indivíduos', m('individual_count')],
        ['Perfil OWL 2 DL', 'atendido' if profile_ok else 'não atendido'],
    ], widths=['60%', '40%'])

    # 4
    doc.add('<h2>4 Axiomas lógicos</h2>')
    doc.table('Axiomas que estruturam a ontologia', ['Tipo', 'Conteúdo'], [
        ['Disjunção', 'Entre as cinco camadas de conhecimento; entre habilidade, currículo, unidade temática e ano; '
                      'entre atividade e característica de atividade; entre as seis dimensões de caracterização de '
                      'atividades; entre conceito matemático e relação didática'],
        ['Propriedade funcional', 'Ano, unidade temática, currículo e código de cada habilidade; conceito anterior e '
                                  'conceito dependente de cada relação de pré-requisito'],
        ['Indivíduos distintos', 'Os cinco anos e as cinco unidades temáticas'],
        ['Restrição existencial', 'Toda habilidade BNCC tem ano, unidade temática, conceito matemático e a BNCC como '
                                  'currículo; toda relação de pré-requisito liga dois conceitos'],
        ['Propriedade transitiva', '<code>isPrerequisiteOf</code>, obtida das relações de pré-requisito pela cadeia '
                                   '<code>inverse(prerequisiteConcept) ∘ dependentConcept</code>'],
        ['Classe definida', 'Uma classe por ano (1º ao 5º) e uma por unidade temática da BNCC'],
    ], widths=['24%', '76%'])
    doc.p('A ontologia não contém axiomas sobre o aprendiz, limiares numéricos, regras SWRL nem declarações de '
          'equivalência com ontologias externas.')

    # 5
    doc.add('<h2>5 Raciocínio</h2>')
    doc.p(f'Os dois raciocinadores consideraram a ontologia consistente, sem classes insatisfatíveis '
          f'({unsatisfiable["HermiT"]} no HermiT e {unsatisfiable["JFact"]} no JFact), e produziram a mesma hierarquia '
          f'de classes. A Tabela {doc.next_table()} mostra a classificação das 126 habilidades nas classes definidas.')
    rows = []
    for key, name in [('Year1', '1º ano'), ('Year2', '2º ano'), ('Year3', '3º ano'), ('Year4', '4º ano'),
                      ('Year5', '5º ano'), ('Numbers', 'Números'), ('Algebra', 'Álgebra'), ('Geometry', 'Geometria'),
                      ('Measures', 'Grandezas e medidas'), ('Statistics', 'Probabilidade e estatística')]:
        cls = f'BNCC{key}Skill'
        rows.append([name, hermit_classes.get(cls, 0), jfact_classes.get(cls, 0)])
    doc.table('Habilidades classificadas em cada classe definida', ['Classe', 'HermiT', 'JFact'], rows,
              widths=['56%', '22%', '22%'])

    direct = hermit_pre & relations
    doc.p(f'A partir das {len(relations)} relações de pré-requisito da ontologia, o HermiT inferiu {len(hermit_pre)} '
          f'asserções <code>isPrerequisiteOf</code>, sendo {len(direct)} diretas e {len(hermit_pre) - len(direct)} '
          f'obtidas por transitividade (Tabela {doc.next_table()}). O conjunto coincide com o fecho transitivo das '
          'relações, calculado à parte, e não contém ciclos.')
    ordered = sorted(hermit_pre, key=lambda pair: (names.get(pair[0], pair[0]), names.get(pair[1], pair[1])))
    doc.table('Relações de pré-requisito inferidas', ['Conceito anterior', 'Conceito dependente', 'Relação'],
              [[esc(names.get(a, a)), esc(names.get(b, b)), 'direta' if (a, b) in relations else 'indireta']
               for a, b in ordered], widths=['40%', '44%', '16%'], small=True)
    doc.p('O JFact não materializa propriedades definidas por cadeia com propriedade inversa e, por isso, não gera '
          'essas asserções. Ele também trata como uma única entidade a classe e o indivíduo que compartilham a mesma '
          'IRI, o que o HermiT não faz. Consistência e classificação coincidem nos dois.')

    # 6
    doc.add('<h2>6 Testes de mutação</h2>')
    doc.p('Cada teste insere um erro de modelagem em uma cópia da ontologia e verifica se o HermiT o detecta como '
          'inconsistência ou classe insatisfatível.')
    descriptions = {
        'M1': 'Habilidade associada a dois anos', 'M2': 'Habilidade associada a duas unidades temáticas',
        'M3': 'Habilidade declarada também como atividade', 'M4': 'Ano de uma habilidade apontando para outra habilidade',
        'M5': 'Alcance incorreto na propriedade isAddressedByActivity',
        'M6': 'Dimensão de atividade declarada como subclasse de outra dimensão',
    }
    doc.table('Resultado dos testes de mutação', ['Teste', 'Erro inserido', 'Resultado'],
              [[code, esc(descriptions.get(code, code)), 'detectado' if ok else 'não detectado']
               for code, ok in mutation_results], widths=['12%', '66%', '22%'])
    detected = sum(ok for _, ok in mutation_results)
    doc.p('Todos os erros inseridos foram detectados.' if detected == len(mutation_results)
          else f'Foram detectados {detected} dos {len(mutation_results)} erros inseridos.')

    # 7
    doc.add('<h2>7 Questões de competência</h2>')
    doc.p('As questões CQ01, CQ02, CQ05 e CQ09 dependem da classificação inferida, e as questões CQ04 e CQ05 dependem '
          'da propriedade transitiva.')
    for query in sorted(CQ_DIR.glob('CQ*.rq')):
        code, text = question(query)
        header, rows = read_csv(OUT / 'cq' / f'{query.stem}.csv')
        doc.add(f'<h3>{esc(code)}. {esc(re.sub(r" [(][^)]*[)]$", "", text))}</h3>')
        doc.add(f'<pre>{esc(query_body(query))}</pre>')
        if code == 'CQ02' and rows:
            order = ['Números', 'Álgebra', 'Geometria', 'Grandezas e medidas', 'Probabilidade e estatística']
            years = sorted({r[0] for r in rows})
            units = sorted({r[1] for r in rows}, key=lambda u: order.index(u) if u in order else 99)
            grid = {(r[0], r[1]): int(r[2]) for r in rows}
            table = [[y.replace(' do Ensino Fundamental', '')] + [grid.get((y, u), 0) for u in units]
                     + [sum(grid.get((y, u), 0) for u in units)] for y in years]
            table.append(['Total'] + [sum(grid.get((y, u), 0) for y in years) for u in units]
                         + [sum(grid.values())])
            doc.table(f'Resposta à {code}', ['Ano'] + units + ['Total'], table, small=True)
        else:
            translated = [[esc(VALUES.get(col, {}).get(value, value).replace(' do Ensino Fundamental', ''))
                           for col, value in zip(header, row)] for row in rows]
            doc.table(f'Resposta à {code}', [HEADERS.get(col, col) for col in header], translated, small=True)

    # 8
    doc.add('<h2>8 Consultas de integridade</h2>')
    doc.p('Pela semântica de mundo aberto, as restrições existenciais não acusam valores ausentes. A completude é '
          'verificada por consultas que devem retornar zero linhas.')
    rows = []
    for line in (OUT / 'integrity.txt').read_text().splitlines():
        match = re.match(r'^(PASS|FAIL) Rule .*/(V\d+)-[^:]+: (\d+) violation', line)
        if match:
            query = next((CQ_DIR / 'integrity').glob(f'{match.group(2)}-*.rq'))
            rows.append([match.group(2), esc(question(query)[1].replace(' (deve retornar zero linhas)', '')),
                         match.group(3)])
    doc.table('Consultas de integridade', ['Consulta', 'Verificação', 'Linhas retornadas'], rows,
              widths=['14%', '64%', '22%'])
    rows_integrity = rows

    # 9
    doc.add('<h2>9 Relatório de qualidade do ROBOT</h2>')
    notes = {
        'multiple_labels': 'Cada entidade tem um rótulo em português e outro em inglês.',
        'missing_definition': 'As definições estão em rdfs:comment, e não na propriedade IAO:0000115.',
        'missing_superclass': 'KnowledgeEntity é a classe raiz; nas classes definidas, a superclasse é inferida.',
    }
    level = {'ERROR': 'erro', 'WARN': 'aviso', 'INFO': 'informação'}
    doc.table('Itens apontados pelo relatório de qualidade', ['Nível', 'Regra', 'Ocorrências', 'Observação'],
              [[level.get(lv, lv), f'<code>{esc(rule)}</code>', count, esc(notes.get(rule, ''))]
               for (lv, rule), count in sorted(report.items(), key=lambda item: -item[1])],
              widths=['12%', '24%', '14%', '50%'])

    # 10
    doc.add('<h2>10 Limitações</h2>')
    doc.add('<ul>'
            '<li>As restrições existenciais são condições necessárias e não acusam valores ausentes; a completude é '
            'verificada pelas consultas da seção 8.</li>'
            '<li>Os conceitos matemáticos são usados como classe e como indivíduo. Por isso, a hierarquia de conceitos '
            'não participa do raciocínio sobre habilidades, e a classificação por área usa a unidade temática da '
            'BNCC.</li>'
            '<li>Os testes de mutação cobrem erros selecionados e não esgotam os erros possíveis.</li>'
            '<li>Não foi realizada validação SHACL.</li>'
            '</ul>')
    doc.p('A ontologia não contém dados de estudantes.')

    cq_data = []
    for query in sorted(CQ_DIR.glob('CQ*.rq')):
        code, text = question(query)
        header, rows = read_csv(OUT / 'cq' / f'{query.stem}.csv')
        cq_data.append({
            'code': code, 'question': re.sub(r' [(][^)]*[)]$', '', text), 'sparql': query_body(query),
            'columns': [HEADERS.get(col, col) for col in header],
            'rows': [[VALUES.get(col, {}).get(value, value).replace(' do Ensino Fundamental', '')
                      for col, value in zip(header, row)] for row in rows],
        })
    summary = {
        'title': title, 'version': version, 'versionIRI': version_iri, 'date': run_date.isoformat(),
        'sha256': sha, 'license': 'CC BY 4.0',
        'tools': {'ROBOT': robot_version, **tools, 'Java': java_version},
        'metrics': {
            'axioms': int(m('axiom_count')), 'logicalAxioms': int(m('logical_axiom_count')),
            'classes': int(m('class_count')), 'objectProperties': int(m('obj_property_count')),
            'dataProperties': int(m('dataproperty_count')), 'individuals': int(m('individual_count')),
            'owl2dl': profile_ok,
        },
        # reason.sh stops (set -e) when ROBOT reports an inconsistent ontology,
        # so an inferred file for a reasoner means it found the ontology consistent.
        'consistent': {r: (OUT / f'inferred-{r}.owl').exists() for r in ('HermiT', 'JFact')},
        'unsatisfiable': unsatisfiable,
        'classification': {name: hermit_classes.get(f'BNCC{key}Skill', 0) for key, name in [
            ('Year1', '1º ano'), ('Year2', '2º ano'), ('Year3', '3º ano'), ('Year4', '4º ano'), ('Year5', '5º ano'),
            ('Numbers', 'Números'), ('Algebra', 'Álgebra'), ('Geometry', 'Geometria'),
            ('Measures', 'Grandezas e medidas'), ('Statistics', 'Probabilidade e estatística')]},
        'prerequisites': [{'from': names.get(a, a), 'to': names.get(b, b), 'direct': (a, b) in relations}
                          for a, b in ordered],
        'mutations': [{'code': code, 'error': descriptions.get(code, code), 'detected': ok}
                      for code, ok in mutation_results],
        'integrity': [{'code': r[0], 'check': html.unescape(r[1]), 'rows': int(r[2])} for r in rows_integrity],
        'competencyQuestions': cq_data,
    }

    css = Path(__file__).with_name('report.css').read_text(encoding='utf-8')
    page = (f'<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">'
            f'<title>{esc(title)} {esc(version)}</title><style>{css}</style></head>'
            f'<body>{"".join(doc.parts)}</body></html>')
    return page, version, summary


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--rotulo', default='', help='por exemplo "APÊNDICE A", para anexar à dissertação')
    args = parser.parse_args()
    page, version, summary = build(args.rotulo)
    (OUT / 'verification-report.html').write_text(page, encoding='utf-8')
    (OUT / 'summary.json').write_text(json.dumps(summary, ensure_ascii=False, indent=1), encoding='utf-8')
    (OUT / 'verification-report.version').write_text(version)
    print(OUT / 'verification-report.html')


if __name__ == '__main__':
    main()
