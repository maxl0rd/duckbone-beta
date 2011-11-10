module Duckbone
  class Templates

    def self.all_handlebars_files
      Dir.glob(Rails.root.join("app/assets/**/*.hbs"))
    end

    # Template files are all .hbs files not beginning with an underscore
    def self.all_template_files
      all_handlebars_files.select do |filename|
        !filename.split('/').last.start_with?('_')
      end
    end

    # Partial files are all .hbs files beginning with an underscore
    def self.all_partial_files
      all_handlebars_files.select do |filename|
        filename.split('/').last.start_with?('_')
      end
    end

    def self.package(files, erb_binding)
      templates = {}
      files.each do |tmpl|
        title = /.*\/templates\/(.*).hbs/.match(tmpl)[1].gsub('/', '_')
        template_text = File.open(Rails.root.join(tmpl)).read
        # Run the template text through ERB to eval asset_paths and the like
        templates[title] = ERB.new(template_text, nil, nil, "template_erb").result(erb_binding)
      end
      templates
    end

    def self.package_templates(erb_binding)
      package(all_template_files, erb_binding).to_json.html_safe
    end

    def self.package_partials(erb_binding)
      package(all_partial_files, erb_binding).to_json.html_safe
    end

    def self.depend_on_all_handlebars_files (asset)
      all_handlebars_files.each { |hbs| asset.depend_on hbs }
    end

  end
end